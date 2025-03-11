from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def test_chromedriver():
    print("Testing ChromeDriver installation...")
    
    try:
        # Set up Chrome options
        options = Options()
        options.add_argument('--headless')  # Run in background
        
        # Try to create a driver
        driver = webdriver.Chrome(options=options)
        
        # Try to visit a website
        driver.get('https://www.google.com')
        
        print("✓ Success! ChromeDriver is working correctly")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    test_chromedriver() 