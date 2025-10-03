import subprocess

def is_process_running(process_name):
    try:
        command = ['pgrep', '-f', process_name]
        result = subprocess.run(command, capture_output=True, text=True)
        
        return result.returncode == 0
    except FileNotFoundError:
        return False

def main():
    print("--- Process Health Checker ---")
    print("(Type 'exit' to stop the program)")

    while True:
        p_name = input("\nEnter the process name to check: ")

        if p_name.lower() == 'exit':
            print("Exiting. Goodbye!")
            break

        if is_process_running(p_name):
            print(f"The process '{p_name}' is running.")
        else:
            print(f"The process '{p_name}' is NOT running.")


if __name__ == "__main__":
    main()
