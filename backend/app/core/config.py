import os
from typing import Dict, Any

class Config:
    """Application configuration"""
    
    # Flask configuration
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    TESTING = os.getenv('FLASK_TESTING', '0') == '1'
    
    # Jira configuration defaults
    DEFAULT_BATCH_SIZE = 100
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    
    # Analysis configuration
    DEFAULT_PERCENTILES = [50, 85, 95]  # median, 85th, 95th percentiles
    BOTTLENECK_THRESHOLDS = {
        'high': 5,
        'medium': 2
    }
    
    @staticmethod
    def get_jira_options() -> Dict[str, Any]:
        """Get Jira client options"""
        return {
            'verify': True,
            'timeout': 30,
            'max_retries': Config.MAX_RETRIES
        }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    JIRA_VERIFY_SSL = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    JIRA_VERIFY_SSL = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    JIRA_VERIFY_SSL = False

# Configuration dictionary
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def get_config():
    """Get current configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(env, DevelopmentConfig)