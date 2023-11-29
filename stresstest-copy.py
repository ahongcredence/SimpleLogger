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
from tabulate import tabulate

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
            response = future.result()
             
            requestID = ""
            if response.status_code == 200:
                successes += 1
                aws_request_id = response.headers.get('x-amzn-RequestId')
                # body_dict = json.loads(response.headers)
                #requestID = body_dict.get("x-amz-request-id")
                print(aws_request_id)
                responses.append(aws_request_id)
            if response.status_code == 500:
                errors += 1
                aws_request_id = response.headers.get('x-amzn-RequestId')
                print(f"Error: {response.status_code} - AWS RequestId: {aws_request_id}")

                
            elif response.status_code == 429:
                tooManyRequests += 1
                
        print("---------------------------------------------\n")

        # Introduce delay between attempts
        if i < attempts:
            time.sleep(delay_ms / 1000.0)  # Convert milliseconds to seconds

        # Creating a list of tuples for tabulation
        data = [
            ("Batch Size", batch_size),
            ("Total Attempts", attempts),
            ("Delay (ms)", delay_ms),
            ("200 Responses", successes),
            ("500 Responses", errors),
            ("429 Responses", tooManyRequests),
            ("Total Responses", successes + errors + tooManyRequests),
        ]

    # Write responses to a text file
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    folder_path = os.path.join(os.getcwd(), 'tests')
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, f"responses_{timestamp}.log")
    with open(file_path, 'w') as file:
        file.write("\n".join(responses))

    print(f"Responses written to: {file_path}")
    # Printing the tabulated data
    table = tabulate(data, headers=["Parameter", "Value"])
    print(table)
    print(responses)
if __name__ == "__main__":
    if len(sys.argv) < 6:
        print("ADJUST PARAMS - Usage: python stress_test.py <your-api-key> <your-api-url> <number-of-attempts> <batch-size> <delay-ms>")
        sys.exit(1)

    api_key = sys.argv[1]
    api_url = sys.argv[2]
    attempts = int(sys.argv[3])
    batch_size = int(sys.argv[4])
    delay_ms = int(sys.argv[5])

    stress_test(api_key, api_url, attempts, batch_size, delay_ms)