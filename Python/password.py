import random
import string

def generate_password(length):
    if length < 4:
        print("Password length should be at least 4.")
        return None

    all_characters = string.ascii_letters + string.digits + string.punctuation
    
    password = "".join(random.choice(all_characters) for _ in range(length))
    
    return password

def main():
    print("--- Random Password Generator ---")
    try:
        password_length = int(input("Enter the desired password length: "))
        
        new_password = generate_password(password_length)
        
        if new_password:
            print(f"\nGenerated Password: {new_password}")

    except ValueError:
        print("Invalid input. Please enter a number.")

if __name__ == "__main__":
    main()
