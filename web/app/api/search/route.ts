// app/api/search/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db/mysql";
import type { DogSearchResponse } from "@/lib/search/types";

function clampInteger(num: number, min: number, max: number) 
{
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

function fixLength(q: string) {
  return (q ?? "").trim().slice(0, 64);
}

function parseSort(x: string | null): "relevance" | "name_asc" | "name_desc" | "newest" 
{
  if (x === "name_asc" || x === "name_desc" || x === "newest" || x === "relevance") return x;
  return "relevance";
}

function parseActive(x: string | null): "Y" | "N" | undefined 
{
  if (x === "Y" || x === "N") return x;
  return undefined;
}

function parseBirthYear(x: string | null): number | undefined 
{
  if (!x) return undefined;
  const n = Number(x);
  if (!Number.isFinite(n)) return undefined;
  const yr = Math.floor(n);
  if (yr < 1900 || yr > 2100) return undefined;
  return yr;
}

export async function GET(req: Request) 
{
  const url = new URL(req.url);
  const sp = url.searchParams;

  const type = sp.get("type") ?? "";
  if (type !== "dog") {
    return NextResponse.json(
      { error: `Unsupported search type '${type}'. Only 'dog' is supported right now.` },
      { status: 400 }
    );
  }

  const q = fixLength(sp.get("q") ?? "");
  const page = clampInteger(Number(sp.get("page") ?? "1"), 1, 1_000_000);
  const limit = clampInteger(Number(sp.get("limit") ?? "20"), 1, 50);
  const sort = parseSort(sp.get("sort"));
  const active = parseActive(sp.get("active"));
  const birthYear = parseBirthYear(sp.get("year"));

  const offset = (page - 1) * limit;

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

  let orderBy = "displayName ASC, d.CWANumber ASC";
  if (sort === "name_desc") orderBy = "displayName DESC, d.CWANumber DESC";
  if (sort === "newest") orderBy = "d.Birthdate DESC, displayName ASC";
  if (sort === "relevance" && q) {
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

  const countSql = `SELECT COUNT(*) AS total ${baseFrom} ${whereSql}`;
  const [countRows] = await pool.query<any[]>(countSql, params);
  const total = Number(countRows?.[0]?.total ?? 0);

  const dataSql = `
    SELECT
      d.CWANumber AS id,
      d.CWANumber AS cwaNumber,
      d.RegisteredName AS registeredName,
      IFNULL(d.CallName, '') AS callName,
      YEAR(d.Birthdate) AS birthYear,
      d.Status AS status,
      IFNULL(owners.ownerNames, '') AS ownerName,
      IFNULL(titles.titleList, '') AS title
    ${baseFrom}
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT :limit OFFSET :offset
  `;

  const [rows] = await pool.query<any[]>(dataSql, params);

  const items = rows.map((r) => 
    ({
    id: String(r.id),
    cwaNumber: String(r.cwaNumber ?? ""),
    registeredName: String(r.registeredName ?? ""),
    callName: String(r.callName ?? ""),
    birthYear: String(r.birthYear ?? ""),
    status: String(r.status ?? ""),
    ownerName: String(r.ownerName ?? ""),
    title: String(r.title ?? ""),
  }));

  const body: DogSearchResponse = 
  {
    ok: true,
    total,
    items,
  };

  return NextResponse.json(body);
}