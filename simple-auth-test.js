import { ScraperService } from './src/services/scraperService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== F95Zone Authentication Test ===');
console.log('Username configured:', !!process.env.F95ZONE_USERNAME);
console.log('Password configured:', !!process.env.F95ZONE_PASSWORD);

if (!process.env.F95ZONE_USERNAME || !process.env.F95ZONE_PASSWORD) {
  console.log('❌ Missing credentials in .env file');
  process.exit(1);
}

console.log('\n🚀 Starting authentication test...');

const scraper = new ScraperService();

const timeout = setTimeout(() => {
  console.log('⏰ Test taking too long, this might indicate an issue');
}, 60000);

try {
  console.log('📡 Attempting to authenticate...');
  const startTime = Date.now();
  
  const result = await scraper.authenticateF95Zone();
  
  const duration = Date.now() - startTime;
  console.log(`⏱️ Authentication took ${duration}ms`);
  
  clearTimeout(timeout);
  
  if (result) {
    console.log('✅ SUCCESS: F95Zone authentication worked!');
    console.log('🎉 Your credentials are correct and bot detection was bypassed');
    
    // Quick status check
    const status = await scraper.getAuthenticationStatus();
    console.log('📊 Status:', status.message);
    
  } else {
    console.log('❌ FAILED: Authentication unsuccessful');
    console.log('💡 Possible causes:');
    console.log('   - Incorrect username/password');
    console.log('   - F95Zone detected bot behavior');
    console.log('   - Site structure changed');
    console.log('   - Network/firewall issues');
    console.log('📸 Check for debug-login-fail.png screenshot');
  }
  
} catch (error) {
  clearTimeout(timeout);
  console.log('💥 ERROR occurred during authentication:');
  console.log('Message:', error.message);
  
  if (error.message.includes('waitForTimeout')) {
    console.log('🔧 This is a Puppeteer version issue - already fixed');
  } else if (error.message.includes('timeout')) {
    console.log('🕒 Timeout error - F95Zone might be slow or blocking requests');
  } else if (error.message.includes('navigation')) {
    console.log('🌐 Navigation error - check internet connection');
  }
  
} finally {
  console.log('\n🧹 Cleaning up...');
  try {
    await scraper.close();
    console.log('✅ Browser closed successfully');
  } catch (closeError) {
    console.log('⚠️ Error closing browser:', closeError.message);
  }
  console.log('🏁 Test completed');
}
