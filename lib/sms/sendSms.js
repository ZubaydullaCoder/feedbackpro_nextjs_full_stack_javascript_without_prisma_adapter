/**
 * Simulated SMS sending functionality
 * In a production environment, this would be replaced with a real SMS provider integration
 * @param {string} to - The phone number to send the SMS to
 * @param {string} body - The content of the SMS message
 * @returns {Promise<{success: boolean, message: string}>} - Result of the SMS sending operation
 */
export async function sendSms(to, body) {
  // Log the SMS details to the console for simulation purposes
  console.log(`[SMS SIMULATION] To: ${to}, Body: ${body}`);
  
  // Simulate a slight delay to mimic real API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would call an SMS provider API
  // and handle potential errors from the provider
  
  return {
    success: true,
    message: 'SMS sent successfully (simulated)'
  };
}
