import os
import logging
import sys

# Configure basic logging before anything else
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('startup')
logger.info("Starting application bootstrap")

from app import create_app

# Get environment
env = os.getenv('FLASK_ENV', 'development')
port = int(os.getenv('PORT', 5000))

# Create app instance at module level for gunicorn
logger.info(f"Creating application with environment: {env}")
app = create_app(env)

if __name__ == '__main__':
    logger = logging.getLogger('app')
    logger.info(f"Starting server on port {port}")
    
    # Run app
    app.run(
        host='0.0.0.0',
        port=port,
        debug=env == 'development'
    )
