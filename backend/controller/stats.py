from flask import Blueprint, jsonify
from classes.stats import Stats
from utils.error_handler import handle_error

stats_bp = Blueprint('stats', __name__, url_prefix='/api/dog/stats')

stats_controller = Stats()

@stats_bp.get('/standings/ytd/<stat_type>/<int:year>')
def get_ytd_standings(stat_type, year):
    try:
        results = stats_controller.get_ytd_standings(stat_type, year)
        return jsonify({
            'success': True,
            'data': results,
            'stat_type': stat_type,
            'year': year,
            'count': len(results)
        }), 200
    except Exception as e:
        return handle_error(e, "Server error")

@stats_bp.get('/<cwa_number>')
@stats_bp.get('/<cwa_number>/year/<int:year>')
def get_dog_info(cwa_number, year=None):
    try:
        result = stats_controller.get_dog_info(cwa_number, year)
        if not result:
            return jsonify({'success': False, 'error': 'Dog not found'}), 404
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return handle_error(e, "Server error")
    
