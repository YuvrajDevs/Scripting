import csv
import os

def process_user_report(filename):
    try:
        with open(filename, mode='r', newline='') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            
            print(f"--- Processing User Report: {filename} ---")
            
            for row in csv_reader:
                username = row['username']
                home_dir = row['home_directory']
                
                dir_exists = os.path.exists(home_dir)
                
                print(f"\n- User: {username}")
                print(f"  Home Directory: {home_dir}")
                
                if dir_exists:
                    print(f"  Status:  Directory exists.")
                else:
                    print(f"  Status:  Directory NOT found.")
            
            print("\n--- Report Complete ---")

    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    process_user_report("users.csv")
