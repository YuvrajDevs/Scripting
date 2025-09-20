import requests

def check_website(url):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return True
        else:
            return False

    except requests.exceptions.RequestException:
        return False

def main():
    print("-- Interactive Website Status Checker --")
    print("(Type 'quit' to stop the program)")

    while True:
        user_url = input("Enter the URL: ")
        if user_url.lower() in ['quit']:
            print("Goodbye !")
            break
        if not user_url.startswith('http'):
            user_url = 'https://' + user_url

        is_up = check_website(user_url)

        if is_up:
            print(f"{user_url} is UP.")
        else:
            print("{user_url} is DOWN.")

if __name__ == "__main__":

    main()



