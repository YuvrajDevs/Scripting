import json
import os

def load_config(filename):
    if not os.path.exists(filename):
        print(f"Error: Configuration file '{filename}' not found.")
        return None

    try:
        with open(filename, 'r') as f:
            config = json.load(f)
            return config
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from '{filename}'. Check for syntax errors.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

def display_config(config):
    if config:
        print("--- Application Configuration Loaded ---")
        
        db_host = config.get('database', {}).get('host', 'N/A')
        print(f"Database Host: {db_host}")
        
        api_key = config.get('api_key', 'N/A')
        print(f"API Key: {api_key}")
        
        debug = config.get('debug_mode', False)
        print(f"Debug Mode: {debug}")
        
        features = config.get('features', [])
        print(f"Enabled Features: {', '.join(features)}")
        
        print("--------------------------------------")

def main():
    config_data = load_config('config.json')
    display_config(config_data)

if __name__ == "__main__":
    main()
