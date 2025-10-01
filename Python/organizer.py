import os
import shutil

TARGET_DIRECTORY = "/home/dem/Downloads"

FILE_TYPES = {
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
    "Documents": [".pdf", ".docx", ".doc", ".txt", ".xls", ".xlsx", ".ppt", ".pptx"],
    "Archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "Audio": [".mp3", ".wav", ".aac"],
    "Video": [".mp4", ".mov", ".avi", ".mkv"]
	}

def organize_files():
    all_files = os.listdir(TARGET_DIRECTORY)
    print(f"Scanning {len(all_files)} files in '{TARGET_DIRECTORY}'...")

    for filename in all_files:
        source_path = os.path.join(TARGET_DIRECTORY, filename)

        if os.path.isfile(source_path):
            _, extension = os.path.splitext(filename)
            
            destination_folder_name = "Other"
            
            for folder_name, extensions_list in FILE_TYPES.items():
                if extension.lower() in extensions_list:
                    destination_folder_name = folder_name
                    break # Found a match, no need to check other rules
            
            destination_path = os.path.join(TARGET_DIRECTORY, destination_folder_name)
            os.makedirs(destination_path, exist_ok=True) # exist_ok=True prevents errors if the folder already exists
            
            shutil.move(source_path, destination_path)
            print(f"Moved: {filename} -> {destination_folder_name}/")

    print("\nOrganization complete!")

if __name__ == "__main__":
    organize_files()
