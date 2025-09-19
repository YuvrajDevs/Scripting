servers = [
         {"name": "web-01", "ip": "192.168.1.101", "status": "running"},
         {"name": "db-01", "ip": "192.168.1.102", "status": "running"}.
         {"name": "app-01", "ip": "192.168.1.103", "status": "stopped"}
         ]

def display_menu():
    print("1. List all servers")
    print("2. Change server status")
    print("3. Quit")

def list_server():
    for server in servers:
        print(f"Name: {server['name']}, IP: {server['ip']}, Status: {server['status']}")


def change_server_status():
    server_name_to_change = input("Enter the name")
    server_found = False
    for server in servers:
        if server["name"] == server_name_to_change:
            new_status = input("Enter new Status for {server_name_to_change}")
            server["status"]=new_status
            print("Successfully changed the status !")
            server_found = True
            break
    if not server_found:
        print("Server not found !")

def main():
    while True:
        display_menu()
        choice = input("Enter your choice (1 to 3): ")

        match choice:
        case "1":
            list_server()
        case "2":
            change_server_status()
        case "3":
            print("Exiting server manager. Goodbye !")
            break
        case _:
            print("Invalid Choice, pick a number between 1 and 3 !")




