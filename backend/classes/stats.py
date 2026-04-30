from mysql.connector import Error
from database import fetch_all, fetch_one

class Stats:
    def get_top_all_time(self, limit=20):
        query = """
            SELECT 
                d.ID as dog_id,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                o.PersonID as owner_id,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                COUNT(DISTINCT r.MeetNumber) as total_races,
                SUM(CASE WHEN rr.Placement = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN rr.Placement <= 3 THEN 1 ELSE 0 END) as podiums,
                AVG(rr.MeetPoints) as avg_time, 
                SUM(rr.MeetPoints) as total_points
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            LEFT JOIN RaceResults rr ON d.CWANumber = rr.CWANumber
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            GROUP BY d.ID, d.RegisteredName, d.CWANumber, o.PersonID, o.FirstName, o.LastName
            ORDER BY total_points DESC, wins DESC
            LIMIT %s
        """
        
        results = fetch_all(query, (limit,))
        
        for idx, dog in enumerate(results, 1):
            dog['rank'] = idx
            dog['avg_time'] = round(dog['avg_time'], 2) if dog['avg_time'] else None
        
        return results
    
    def get_top_by_year(self, year, limit=20):
        query = """
            SELECT 
                d.ID as dog_id,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                o.PersonID as owner_id,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                COUNT(DISTINCT r.MeetNumber) as total_races,
                SUM(CASE WHEN rr.Placement = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN rr.Placement <= 3 THEN 1 ELSE 0 END) as podiums,
                AVG(rr.MeetPoints) as avg_time, 
                SUM(rr.MeetPoints) as total_points
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            LEFT JOIN RaceResults rr ON d.CWANumber = rr.CWANumber
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            WHERE YEAR(r.MeetDate) = %s
            GROUP BY d.ID, d.RegisteredName, d.CWANumber, o.PersonID, o.FirstName, o.LastName
            ORDER BY total_points DESC, wins DESC
            LIMIT %s
        """
        
        results = fetch_all(query, (year, limit))
        
        for idx, dog in enumerate(results, 1):
            dog['rank'] = idx
            dog['avg_time'] = round(dog['avg_time'], 2) if dog['avg_time'] else None
        
        return results

    
    
    def search_stats_by_year(self, year, dog_id=None, owner_id=None):
        query = """
            SELECT 
                d.ID as dog_id,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                d.Birthdate as date_of_birth,
                o.PersonID as owner_id,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                r.MeetNumber as race_id,
                r.MeetDate as race_date,
                r.MeetNumber as race_name,
                rr.Placement as placement,
                rr.MeetPoints as points
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            LEFT JOIN RaceResults rr ON d.CWANumber = rr.CWANumber
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            WHERE YEAR(r.MeetDate) = %s
        """
        
        params = [year]
        
        if dog_id:
            query += " AND d.CWANumber = %s"
            params.append(dog_id)
        
        if owner_id:
            query += " AND o.PersonID = %s"
            params.append(owner_id)
        
        query += " ORDER BY r.MeetDate DESC, rr.Placement ASC"
        
        return fetch_all(query, tuple(params))

    def search_stats_by_dog(self, cwa_number, owner_id, year):
        dog_query = """
            SELECT 
                d.ID as dog_id,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                o.PersonID as owner_id
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            WHERE d.CWANumber = %s
        """
        
        params = [cwa_number]
        if owner_id is not None:
            dog_query += " AND o.PersonID = %s"
            params.append(owner_id)
        
        dog_info = fetch_one(dog_query, tuple(params))
        
        if not dog_info:
            return None
        
        stats_query = """
            SELECT 
                COUNT(DISTINCT r.MeetNumber) as total_races,
                SUM(CASE WHEN rr.Placement = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN rr.Placement = 2 THEN 1 ELSE 0 END) as second_place,
                SUM(CASE WHEN rr.Placement = 3 THEN 1 ELSE 0 END) as third_place,
                SUM(CASE WHEN rr.Placement <= 3 THEN 1 ELSE 0 END) as podiums,
                AVG(rr.MeetPoints) as avg_points,
                SUM(rr.MeetPoints) as total_points
            FROM RaceResults rr
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            WHERE rr.CWANumber = %s
        """
        
        params = [cwa_number]
        if year is not None:
            stats_query += " AND YEAR(r.MeetDate) = %s"
            params.append(year)
        
        stats = fetch_one(stats_query, tuple(params))
        
        recent_query = """
            SELECT 
                r.MeetNumber as race_id,
                r.MeetDate as race_date,
                rr.Placement as placement,
                rr.MeetPoints as points
            FROM RaceResults rr
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            WHERE rr.CWANumber = %s
        """
        
        params = [cwa_number]  
        if year is not None:
            recent_query += " AND YEAR(r.MeetDate) = %s"
            params.append(year)
        
        recent_query += " ORDER BY r.MeetDate DESC LIMIT 10"
        
        recent_races = fetch_all(recent_query, tuple(params))
        
        return {
            'dog_info': dog_info,
            'statistics': {
                **stats,
                'avg_points': round(stats['avg_points'], 2) if stats['avg_points'] else None,
                'year': year if year else 'all_time'
            },
            'recent_races': recent_races
        }



    
    def search_stats_by_owner(self, owner_id, dog_id, year):
        owner_query = """
            SELECT * FROM Person WHERE PersonID = %s
        """
        owner_info = fetch_one(owner_query, (owner_id,))
        
        if not owner_info:
            return None

        dogs_query = """
            SELECT 
                d.ID as dog_id,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                COUNT(DISTINCT r.MeetNumber) as total_races,
                SUM(CASE WHEN rr.Placement = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN rr.Placement <= 3 THEN 1 ELSE 0 END) as podiums,
                AVG(rr.MeetPoints) as avg_time,
                SUM(rr.MeetPoints) as total_points
            FROM Dog d
            LEFT JOIN RaceResults rr ON d.CWANumber = rr.CWANumber
            LEFT JOIN Meet r ON rr.MeetNumber = r.MeetNumber
            INNER JOIN DogOwner do ON d.CWANumber = do.CWAID
            WHERE do.PersonID = %s"""
        
        params = [owner_id]
        
        if year:
            dogs_query += " AND YEAR(r.MeetDate) = %s"
            params.append(year)

        if dog_id:
            dogs_query += " AND d.CWANumber = %s"
            params.append(dog_id)
        
        dogs_query += " GROUP BY d.id, d.RegisteredName, d.CWANumber ORDER BY total_points DESC"
        
        dogs = fetch_all(dogs_query, tuple(params))
        
        total_stats = {
            'total_dogs': len(dogs),
            'total_races': sum(dog['total_races'] or 0 for dog in dogs),
            'total_wins': sum(dog['wins'] or 0 for dog in dogs),
            'total_podiums': sum(dog['podiums'] or 0 for dog in dogs),
            'total_points': sum(dog['total_points'] or 0 for dog in dogs)
        }
        
        for dog in dogs:
            dog['avg_time'] = round(dog['avg_time'], 2) if dog['avg_time'] else None
        
        return {
            'owner_info': owner_info,
            'total_statistics': total_stats,
            'dogs': dogs,
            'year': year if year else 'all_time'
        }


    def get_available_years(self):
        query = """
            SELECT DISTINCT YEAR(MeetDate) as year 
            FROM Meet 
            ORDER BY year DESC
        """
        
        results = fetch_all(query)
        return [row['year'] for row in results]
    
    def get_dog_info(self, cwa_number, year=None):
        params = []
        
        meet_results_join = """
            LEFT JOIN (
                SELECT
                    CWANumber,
                    COALESCE(SUM(MeetPoints), 0) AS total_meet_points,
                    COALESCE(SUM(MatchPoints), 0) AS total_match_points,
                    COALESCE(SUM(HCScore), 0) AS total_hc_score,
                    COALESCE(SUM(ShowPoints), 0) AS total_show_points,
                    COALESCE(SUM(DPCPoints), 0) AS total_dpc_points
                FROM MeetResults mr
        """

        if year:
            meet_results_join += " JOIN Meet m ON m.MeetNumber = mr.MeetNumber WHERE YEAR(m.MeetDate) = %s"
            params.append(year)

        meet_results_join += """
                GROUP BY CWANumber
            ) rr ON d.CWANumber = rr.CWANumber
        """

        manual_meet_expr = "0" if year else "COALESCE(d.ManualMeetPointsAdjustment, 0)"
        manual_show_expr = "0" if year else "COALESCE(d.ManualShowPointsAdjustment, 0)"
        manual_dpc_expr = "0" if year else "COALESCE(d.ManualDPCPointsAdjustment, 0)"

        query = f"""
            SELECT 
                d.*,
                CONCAT(o.FirstName, ' ', o.LastName) AS owner_name,
                o.PersonID AS owner_id,
                COALESCE(rr.total_meet_points, 0) + {manual_meet_expr} AS total_meet_points,
                COALESCE(rr.total_match_points, 0) AS total_match_points,
                COALESCE(rr.total_hc_score, 0) AS total_hc_score,
                COALESCE(rr.total_show_points, 0) + {manual_show_expr} AS total_show_points,
                COALESCE(rr.total_dpc_points, 0) + {manual_dpc_expr} AS total_dpc_points
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.ID
            {meet_results_join}
            WHERE d.CWANumber = %s
        """

        params.append(cwa_number)

        return fetch_one(query, tuple(params))
    
    # this will apply ranking that matches Krista's order requests:
    #   1) tied values receive the same rank
    #   2) next rank(s) #'s are skipped based on number of ties
    #      (example: 1, 2, 2, 4)
    def apply_competition_ranking(self, rows, value_key="value"):
        prev_value = None
        prev_rank = 0

        for idx, row in enumerate(rows, 1):
            current_value = row.get(value_key, 0) or 0

            if prev_value is not None and current_value == prev_value:
                row['rank'] = prev_rank
            else:
                row['rank'] = idx
                prev_rank = idx

            prev_value = current_value

        return rows


    def get_ytd_hc_wins(self, year):
        query = """
            WITH eligible AS (
                SELECT
                    mr.MeetNumber,
                    mr.CWANumber,
                    mr.MeetPlacement,
                    mr.ConformationPlacement,
                    (mr.MeetPlacement + mr.ConformationPlacement) AS combined_score
                FROM MeetResults mr
                JOIN Meet m ON m.MeetNumber = mr.MeetNumber
                WHERE YEAR(m.MeetDate) = %s
                AND mr.MeetPlacement IS NOT NULL
                AND mr.ConformationPlacement IS NOT NULL
                AND mr.MeetPlacement < (
                    SELECT MAX(x.MeetPlacement)
                    FROM MeetResults x
                    WHERE x.MeetNumber = mr.MeetNumber
                    AND x.MeetPlacement IS NOT NULL
                )
                AND mr.ConformationPlacement < (
                    SELECT MAX(y.ConformationPlacement)
                    FROM MeetResults y
                    WHERE y.MeetNumber = mr.MeetNumber
                    AND y.ConformationPlacement IS NOT NULL
                )
            ),
            winners AS (
                SELECT e.*
                FROM eligible e
                WHERE e.combined_score = (
                    SELECT MIN(e2.combined_score)
                    FROM eligible e2
                    WHERE e2.MeetNumber = e.MeetNumber
                )
                AND e.MeetPlacement = (
                    SELECT MIN(e3.MeetPlacement)
                    FROM eligible e3
                    WHERE e3.MeetNumber = e.MeetNumber
                    AND e3.combined_score = e.combined_score
                )
            )
            SELECT
                d.ID as dog_id,
                d.CallName as call_name,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                o.PersonID as owner_id,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                COUNT(*) as value
            FROM winners w
            LEFT JOIN Dog d ON w.CWANumber = d.CWANumber
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            GROUP BY
                d.ID,
                d.CallName,
                d.RegisteredName,
                d.CWANumber,
                o.PersonID,
                o.FirstName,
                o.LastName
            HAVING COUNT(*) > 0
            ORDER BY value DESC, d.RegisteredName ASC
        """

        results = fetch_all(query, (year,))
        return self.apply_competition_ranking(results, 'value')

    # returns the YTD standings for a specific stat
    def get_ytd_standings(self, stat_type, year):
        # if the year is not valid, return empty list
        if year not in self.get_available_years():
            return []
        
        if stat_type == 'hc_wins':
            return self.get_ytd_hc_wins(year)

        # map stat type to the correct DB column name
        stat_map = {
            'meet_points': 'MeetPoints',
            'match_points': 'ShowPoints',
            'hc_wins': 'HighCombinedWins',
            'narx': 'NARXEarned'
        }

        # if the stat type is not valid, return empty list
        if stat_type not in stat_map:
            return []
        
        stat_column = stat_map[stat_type]

        query = f"""
            SELECT
                d.ID as dog_id,
                d.CallName as call_name,
                d.RegisteredName as dog_name,
                d.CWANumber as cwanumber,
                o.PersonID as owner_id,
                CONCAT(o.FirstName, ' ', o.LastName) as owner_name,
                COALESCE(SUM(mr.{stat_column}), 0) as value
            FROM Dog d
            LEFT JOIN DogOwner do ON d.CWANumber = do.CWAID
            LEFT JOIN Person o ON do.PersonID = o.PersonID
            LEFT JOIN MeetResults mr ON d.CWANumber = mr.CWANumber
            LEFT JOIN Meet m ON mr.MeetNumber = m.MeetNumber
            WHERE YEAR(m.MeetDate) = %s
            GROUP BY
                d.ID,
                d.CallName,
                d.RegisteredName,
                d.CWANumber,
                o.PersonID,
                o.FirstName,
                o.LastName
            HAVING COALESCE(SUM(mr.{stat_column}), 0) > 0
            ORDER BY value DESC, d.RegisteredName ASC
        """

        results = fetch_all(query, (year,))

        return self.apply_competition_ranking(results, 'value')
        



