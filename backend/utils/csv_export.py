from database import fetch_all
import io
import csv


def get_current_grading_guide_CSV(meet_number: str = None):
    """
    Export grading guide data to CSV format.
    If meet_number is provided, returns dogs from that specific meet.
    Otherwise returns all dogs with their current grading info.
    """
    if meet_number:
        rows = fetch_all(
            """
            SELECT DISTINCT
                Dog.CWANumber,
                Dog.CallName,
                Dog.RegisteredName,
                Dog.CurrentGrade,
                Dog.Average,
                Dog.DPCPoints,
                Dog.HighCombinedWins,
                Dog.ARXPoints,
                Dog.NARXPoints
            FROM Dog
            INNER JOIN MeetResults ON Dog.CWANumber = MeetResults.CWANumber
            WHERE MeetResults.MeetNumber = %s
            ORDER BY Dog.CWANumber
            """,
            (meet_number,),
        )
    else:
        rows = fetch_all(
            """
            SELECT
                CWANumber,
                CallName,
                RegisteredName,
                CurrentGrade,
                Average,
                DPCPoints,
                HighCombinedWins,
                ARXPoints,
                NARXPoints
            FROM Dog
            ORDER BY CWANumber
            """
        )

    if not rows:
        return None

    output = io.StringIO()
    fieldnames = rows[0].keys()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

    return output.getvalue()
