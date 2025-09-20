import requests

def get_jokes():
    api_url = "https://official-joke-api.appspot.com/jokes/programming/random"
    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            joke_data = response.json()[0]
            setup = joke_data['setup']
            punchline = joke_data['punchline']

            print("Here's the Joke ! ")
            print(f"Q: {setup}")
            print(f"A: {punchline}")
        else:
            print("Could not fetch the Joke !")

    except requests.exceptions.RequestException as e:
        print("An error occured")

if __name__ == "__main__":
    get_jokes()

