// app/api/search/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db/mysql";
import type { DogSearchResponse, DogSearchResult } from "@/lib/search/types";

function clampInteger(num: number, min: number, max: number) {
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

function fixLength(q: string) {
  return (q ?? "").trim().slice(0, 64);
}

function parseSort(x: string | null): "relevance" | "name_asc" | "name_desc" | "newest" {
  if (x === "name_asc" || x === "name_desc" || x === "newest" || x === "relevance") return x;
  return "relevance";
}

function parseActive(x: string | null): "Y" | "N" | undefined {
  if (x === "Y" || x === "N") return x;
  return undefined;
}

function parseBirthYear(x: string | null): number | undefined {
  if (!x) return undefined;
  const n = Number(x);
  if (!Number.isFinite(n)) return undefined;
  const yr = Math.floor(n);
  if (yr < 1900 || yr > 2100) return undefined;
  return yr;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const type = sp.get("type") ?? "";
  if (type !== "dog") {
    return NextResponse.json(
      { error: `Unsupported search type '${type}'. Only 'dog' is supported right now.` },
      { status: 400 }
    );
  }

  // Normalize inputs
  const q = fixLength(sp.get("q") ?? "");
  const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
  const limit = clampInteger(Number(sp.get("limit") ?? "20"), 1, 50);
  const sort = parseSort(sp.get("sort"));
  const active = parseActive(sp.get("active"));
  const birthYear = parseBirthYear(sp.get("birthYear")); // <-- keep this; you said birthYear is "fixed"

  const offset = (page - 1) * limit;

  // Build WHERE
  const where: string[] = [];
  const params: Record<string, any> = { limit, offset };

  if (q) {
    params.qLike = `%${q.toLowerCase()}%`;
    where.push(`
      (
        LOWER(d.CWANumber) LIKE :qLike
        OR LOWER(d.RegisteredName) LIKE :qLike
        OR LOWER(IFNULL(d.CallName,'')) LIKE :qLike
        OR LOWER(IFNULL(owners.ownerNames,'')) LIKE :qLike
        OR LOWER(IFNULL(owners.ownerEmails,'')) LIKE :qLike
        OR LOWER(IFNULL(titles.titleList,'')) LIKE :qLike
      )
    `);
  }

  if (typeof birthYear === "number") {
    where.push(`YEAR(d.Birthdate) = :birthYear`);
    params.birthYear = birthYear;
  }

  if (active) {
    if (active === "Y") where.push(`d.Status = 'Active'`);
    else where.push(`d.Status <> 'Active'`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Sort mapping
  let orderBy = "displayName ASC, d.CWANumber ASC";
  if (sort === "name_desc") orderBy = "displayName DESC, d.CWANumber DESC";
  if (sort === "newest") orderBy = "d.Birthdate DESC, displayName ASC";
  if (sort === "relevance") {
    // cheap relevance: prefer registered/call name matches over owner/title matches
    // Only apply if q exists; otherwise fall back to name ASC.
    if (q) {
      orderBy = `
        CASE
          WHEN LOWER(d.CallName) LIKE :qLike THEN 0
          WHEN LOWER(d.RegisteredName) LIKE :qLike THEN 1
          WHEN LOWER(d.CWANumber) LIKE :qLike THEN 2
          ELSE 3
        END,
        displayName ASC,
        d.CWANumber ASC
      `;
    }
  }

  const baseFrom = `
    FROM Dog d
    LEFT JOIN (
      SELECT
        do.CWAID,
        GROUP_CONCAT(DISTINCT CONCAT(p.FirstName,' ',p.LastName) ORDER BY p.LastName SEPARATOR ', ') AS ownerNames,
        GROUP_CONCAT(DISTINCT IFNULL(p.EmailAddress,'') ORDER BY p.EmailAddress SEPARATOR ', ') AS ownerEmails
      FROM DogOwner do
      LEFT JOIN Person p ON p.PersonID = do.PersonID
      GROUP BY do.CWAID
    ) owners ON owners.CWAID = d.CWANumber
    LEFT JOIN (
      SELECT
        dt.CWANumber,
        GROUP_CONCAT(DISTINCT dt.Title ORDER BY dt.Title SEPARATOR ', ') AS titleList
      FROM DogTitles dt
      GROUP BY dt.CWANumber
    ) titles ON titles.CWANumber = d.CWANumber
  `;

  // total count
  const countSql = `SELECT COUNT(*) AS total ${baseFrom} ${whereSql}`;
  const [countRows] = await pool.query<any[]>(countSql, params);
  const total = Number(countRows?.[0]?.total ?? 0);

  // page query
  const dataSql = `
    SELECT
      d.CWANumber AS id,
      COALESCE(NULLIF(d.CallName,''), d.RegisteredName) AS displayName,
      d.CWANumber AS regNo,
      YEAR(d.Birthdate) AS birthYear,
      owners.ownerNames AS ownerName,
      titles.titleList AS titleList,
      CASE WHEN d.Status = 'Active' THEN 'Y' ELSE 'N' END AS activeYN
    ${baseFrom}
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT :limit OFFSET :offset
  `;

  const [rows] = await pool.query<any[]>(dataSql, params);

  const items: DogSearchResult[] = rows.map((r) => ({
    id: String(r.id),
    name: String(r.displayName ?? ""),
    regNo: r.regNo ?? undefined,
    // keep YOUR TS field as `year` if that’s what you want in UI:
    year: typeof r.birthYear === "number" ? r.birthYear : undefined,
    ownerName: r.ownerName ?? undefined,
    title: r.titleList ?? undefined,
    active: r.activeYN === "Y" ? "Y" : "N",
  }));

  const body: DogSearchResponse = {
    params: {
      q,
      page,
      limit,
      sort,
      year: typeof birthYear === "number" ? birthYear : undefined, // keeping your existing response shape
      active,
    },
    total,
    items,
  };

  return NextResponse.json(body);
}