from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException
from PIL import Image
import pytesseract
import time
import json
import os
import undetected_chromedriver as uc

def setup_driver():
    chrome_options = uc.ChromeOptions()
    chrome_options.add_argument('--headless')  # Run in headless mode
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--remote-debugging-port=9222')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Use user data directory from environment if set
    if 'CHROME_USER_DATA_DIR' in os.environ:
        chrome_options.add_argument(f'--user-data-dir={os.environ["CHROME_USER_DATA_DIR"]}')
    
    # Initialize the driver with these options
    try:
        driver = uc.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {str(e)}")
        raise

def get_connections_words():
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--remote-debugging-port=9222')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Use user data directory from environment if set
    if 'CHROME_USER_DATA_DIR' in os.environ:
        chrome_options.add_argument(f'--user-data-dir={os.environ["CHROME_USER_DATA_DIR"]}')
    
    print("Starting with Chrome options configured...")
    
    try:
        service = Service()
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.set_page_load_timeout(30)
        
        # Navigate to connectionsplus.io
        print("Navigating to connectionsplus.io...")
        try:
            driver.get('https://connectionsplus.io/nyt-archive?sortBy=newest&page=1')
            print("Successfully loaded the page")
        except Exception as e:
            print(f"Error loading page: {str(e)}")
            raise
        
        # Wait for the table to load and find the first puzzle link
        print("Looking for latest puzzle...")
        try:
            latest_puzzle = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//tr[1]//a[contains(text(), 'Connections #')]"))
            )
            print("Found latest puzzle link")
        except Exception as e:
            print(f"Error finding puzzle link: {str(e)}")
            raise
        
        # Get puzzle number for verification
        puzzle_text = latest_puzzle.text
        print(f"Found puzzle: {puzzle_text}")
        
        # Click the latest puzzle
        print("Clicking latest puzzle...")
        driver.execute_script("arguments[0].click();", latest_puzzle)
        
        # Wait for the puzzle grid to load
        print("Waiting for puzzle grid...")
        time.sleep(5)  # Initial delay after clicking
        
        # Try to find all word elements
        print("Looking for word elements...")
        try:
            # Wait for JS to load
            WebDriverWait(driver, 20).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            print("Page fully loaded")
            
            # Wait for React to render
            time.sleep(3)
            
            # Try to find the title first to ensure we're on the right page
            try:
                title = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, f"//h1[contains(text(), '{puzzle_text}')]"))
                )
                print("Found puzzle title:", title.text)
            except Exception as e:
                print(f"Warning: Could not find title: {e}")
            
            # Try to find words using multiple methods
            print("Searching for words...")
            
            # Method 1: Wait for any button to appear first
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "button, [role='button']"))
            )
            print("Found interactive elements")
            
            # Method 2: Get all text content
            words = driver.execute_script("""
                return Array.from(document.querySelectorAll('*'))
                    .filter(el => {
                        const text = el.textContent.trim();
                        return text.length > 0 
                            && text.length < 20 
                            && !el.children.length 
                            && getComputedStyle(el).display !== 'none';
                    })
                    .map(el => el.textContent.trim())
                    .filter((text, index, self) => 
                        self.indexOf(text) === index && 
                        text.toUpperCase() === text &&
                        text.length > 1
                    );
            """)
            
            print(f"Found {len(words)} potential words")
            if words:
                print("Sample words:", words[:5])
            
            if len(words) >= 16:
                words = words[:16]
                print("Final word list:", words)
                driver.save_screenshot('found_words.png')
                with open('today_words.json', 'w') as f:
                    json.dump(words, f)
                return words
            
            # If we get here, try one last method
            print("Trying fallback method...")
            elements = driver.find_elements(By.CSS_SELECTOR, '[role="button"]')
            if elements:
                words = [el.text.strip() for el in elements if el.text.strip()]
                print(f"Found {len(words)} words using fallback method")
                if len(words) >= 16:
                    words = words[:16]
                    print("Final word list:", words)
                    with open('today_words.json', 'w') as f:
                        json.dump(words, f)
                    return words
            
            print("Could not find enough words")
            driver.save_screenshot('no_words_found.png')
            raise Exception("Could not find 16 words")
                
        except Exception as e:
            print(f"Error finding words: {str(e)}")
            driver.save_screenshot('error_state.png')
            with open('page_source.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print("Current page URL:", driver.current_url)
            print("Page title:", driver.title)
            print("DOM snapshot:")
            print(driver.execute_script("return document.documentElement.outerHTML;")[:1000])
            raise
        
    except Exception as e:
        print(f"Error: {str(e)}")
        # Save screenshot for debugging
        if 'driver' in locals():
            driver.save_screenshot('error_state.png')
            with open('error_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
        raise
        
    finally:
        if 'driver' in locals():
            driver.quit()
            print("Browser closed")
        if os.path.exists('board.png'):
            os.remove('board.png')

if __name__ == "__main__":
    try:
        words = get_connections_words()
        print("Script completed successfully")
    except Exception as e:
        print(f"Final error: {str(e)}")