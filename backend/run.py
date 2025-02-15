import os
from app import create_app

# Create app instance at module level for gunicorn
app = create_app()

if __name__ == '__main__':
    # Get environment
    env = os.getenv('FLASK_ENV', 'development')
    
    # Run app
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=env == 'development'
    )