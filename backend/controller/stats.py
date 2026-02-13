from flask import Blueprint, request, jsonify
from classes.stats import Stats

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

stats_controller = Stats()

@stats_bp.get('/top/all-time/<int:limit>')
def get_top_all_time(limit):
    try:
        results = stats_controller.get_top_all_time(limit)
        return jsonify({'success': True, 'data': results, 'count': len(results)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stats_bp.get('/top/<int:year>/<int:limit>')
def get_top_by_year(year, limit):
    try:
        results = stats_controller.get_top_by_year(year, limit)
        return jsonify({'success': True, 'data': results, 'count': len(results)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.get('/search/year/<int:year>')
def search_by_year(year):
    try:
        dog_id = request.args.get('dog_id', type=str, default=None) 
        owner_id = request.args.get('owner_id', type=str, default=None)
        results = stats_controller.search_stats_by_year(year, dog_id, owner_id)
        return jsonify({'success': True, 'data': results, 'year': year, 'count': len(results)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stats_bp.get('/search/dog/<dog_id>')
def search_by_dog(dog_id):
    try:
        year = request.args.get('year', type=int)
        owner_id = request.args.get('owner_id', type=str)
        result = stats_controller.search_stats_by_dog(dog_id, owner_id, year)
        if not result:
            return jsonify({'success': False, 'error': 'Dog not found'}), 404
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stats_bp.get('/search/owner/<owner_id>')
def search_by_owner(owner_id):
    try:
        year = request.args.get('year', type=int)
        dog_id = request.args.get('dog_id', type=str)
        result = stats_controller.search_stats_by_owner(owner_id, dog_id, year)
        if not result:
            return jsonify({'success': False, 'error': 'Owner not found'}), 404
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@stats_bp.get('/years')
def get_years():
    try:
        years = stats_controller.get_available_years()
        return jsonify({'success': True, 'data': years}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
