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
