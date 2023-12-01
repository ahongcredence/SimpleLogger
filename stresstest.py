import requests
from faker import Faker
import json
import sys
import os
import datetime
import random
import string
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from tabulate import tabulate

def generate_payload():
    system_code = f"{random.randint(100, 999)}"
    message_length = random.randint(1, 50)
    random_message = ''.join(random.choices(string.ascii_letters + string.digits, k=message_length))
    current_timestamp = datetime.datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')
    log_level_array = ['trace', 'debug', 'info', 'error']
    random_log_level = random.choice(log_level_array)

    return {
        'body': {
            'timestamp': current_timestamp,
            'systemCode': system_code,
            'message': random_message,
            'severity': random_log_level,
            'source': 'LambdaFunction'
        },
        'httpMethod': 'POST'
    }

def stress_test(api_key, api_url, attempts, batch_size, delay_ms):
    fake = Faker()
    successes = 0
    errors = 0
    too_many_requests = 0
    responses = []

    session = requests.Session()
    session.headers.update({'x-api-key': api_key, 'Content-Type': 'application/json'})

    with ThreadPoolExecutor() as executor:
        currentAttempt = 0
        for i in range(1, attempts + 1):
            futures = [executor.submit(session.post, api_url, json=generate_payload()) for _ in range(batch_size)]
            
            currentAttempt+=1
            for future in as_completed(futures):
                
                try:
                    response = future.result()
                    aws_request_id = response.headers.get('x-amz-request-id')
                    if response.status_code == 200:
                        successes += 1
                        
                        responses.append(aws_request_id)
                    elif response.status_code == 500:
                        errors += 1
                        
                    elif response.status_code == 429:
                        too_many_requests += 1
                    print(f"METHOD: POST | Attempt {currentAttempt} of {attempts}: Successes: {successes} | 500 Errors: {errors} | 429 Errors: {too_many_requests}", end='\r')
                except Exception as e:
                    print(f"An error occurred: {e}")
                
            if i < attempts:
                time.sleep(delay_ms / 1000.0)
            print()
    writeAndPrint(responses, batch_size, attempts, delay_ms, successes, errors, too_many_requests)

def writeAndPrint(responses, batch_size, attempts, delay_ms, successes, errors, too_many_requests):
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    folder_path = os.path.join(os.getcwd(), 'tests')
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, f"responses_{timestamp}.log")
    with open(file_path, 'w') as file:
        file.write("\n".join(responses))
    print()
    table = tabulate([
        ("Batch Size", batch_size),
        ("Total Attempts", attempts),
        ("Delay (ms)", delay_ms),
        ("200 Responses", successes),
        ("500 Responses", errors),
        ("429 Responses", too_many_requests),
        ("Total Responses", successes + errors + too_many_requests),
    ], headers=["Parameter", "Value"])
    print(table)
    print()
    print(f"Responses written to: {file_path}")



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
