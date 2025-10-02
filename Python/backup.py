import os
import shutil
from datetime import datetime

SOURCE_DIRECT = "/home/dem/Downloads"

DESTINATION_DIRECTORY = "/home/dem/Desktop/Backup"


def create_backup():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    backup_folder_name = f"{os.path.basename(SOURCE_DIRECTORY)}-{timestamp}"
    
    destination_path = os.path.join(DESTINATION_DIRECTORY, backup_folder_name)
    
    print(f"Starting backup of '{SOURCE_DIRECTORY}'...")
    
    try:
        shutil.copytree(SOURCE_DIRECTORY, destination_path)
        print("\nBackup successful!")
        print(f"Your files have been backed up to: {destination_path}")
    except FileNotFoundError:
        print(f"Error: Source directory not found at '{SOURCE_DIRECTORY}'")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    create_backup()
