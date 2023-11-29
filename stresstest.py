import requests
from faker import Faker
import json
import sys
import os
import datetime
import random
import string
from concurrent.futures import ThreadPoolExecutor
import time

def generate_payload():
    # Generate a new random 3-digit number for the system code
    system_code = f"{random.randint(100, 999)}"

    # Generate a new random string of less than 50 characters for the message
    message_length = random.randint(1, 50)
    random_message = ''.join(random.choices(string.ascii_letters + string.digits, k=message_length))

    # Get the current timestamp in the required format
    current_timestamp = datetime.datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')

    logLevelArray = ['trace', 'debug', 'info', 'error']
    randomLogLevel = random.choice(logLevelArray)

    return {
        'body': {
            'timestamp': current_timestamp,
            'systemCode': system_code,
            'message': random_message,
            'severity': randomLogLevel,
            'source': 'LambdaFunction'
        },
        'httpMethod': 'POST'
    }

def stress_test(api_key, api_url, attempts, batch_size, delay_ms):
    fake = Faker()
    successes = 0
    errors = 0
    tooManyRequests = 0
    responses = []

    # Use session for HTTP requests to reuse underlying TCP connection instead of making new one each time
    session = requests.Session()
    session.headers.update({'x-api-key': api_key, 'Content-Type': 'application/json'})

    for i in range(1, attempts + 1):
        print(f"Attempt {i}:\n")

        # Use concurrent.futures for parallel execution
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(session.post, api_url, data=json.dumps(generate_payload())) for _ in range(batch_size)]

        # Print responses and errors, and tally up the counts
        for future in futures:
            try:
                response = future.result()
                print(f"Response: {response.text}")
                responses.append(f"Response: {response.text}")
                if response.status_code == 200:
                    successes += 1
                elif response.status_code == 500:
                    errors += 1
                elif response.status_code == 429:
                    tooManyRequests +=1
            except Exception as e:
                print(f"Error: {e}")
                responses.append(f"Error: {e}")
                errors += 1

        print("---------------------------------------------\n")

        # Introduce delay between attempts
        if i < attempts:
            time.sleep(delay_ms / 1000.0)  # Convert milliseconds to seconds

    # Print final counts
    print(f"200 Responses: {successes}")
    print(f"500 Responses: {errors}")
    print(f"429 Responses: {tooManyRequests}")
    print(f"Total Responses: {successes + errors + tooManyRequests}")

    # Write responses to a text file
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    folder_path = os.path.join(os.getcwd(), 'tests')
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, f"responses_{timestamp}.txt")

    with open(file_path, 'w') as file:
        file.write("\n".join(responses))

    print(f"Responses written to: {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("Usage: python stress_test.py <your-api-key> <your-api-url> <number-of-attempts> <batch-size> <delay-ms>")
        sys.exit(1)

    api_key = sys.argv[1]
    api_url = sys.argv[2]
    attempts = int(sys.argv[3])
    batch_size = int(sys.argv[4])
    delay_ms = int(sys.argv[5])

    stress_test(api_key, api_url, attempts, batch_size, delay_ms)
