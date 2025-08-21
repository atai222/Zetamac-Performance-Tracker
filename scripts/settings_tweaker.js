chrome.storage.local.get(['trainingGoal', 'trainingType'], function(data) {
  const goal = data.trainingGoal;
  const trainingType = data.trainingType;

  if (!goal || !trainingType) {
    return;
  }

  console.log('[Zetamac Trainer] Setting up training for:', goal);
  console.log('[Zetamac Trainer] Training type:', trainingType);

  // Wait for page to load
  setTimeout(function() {
    // Get all the control elements
    const addCheck = document.getElementById('add');
    const subCheck = document.getElementById('sub');
    const mulCheck = document.getElementById('mul');
    const divCheck = document.getElementById('div');
    
    // Get number range controls if they exist
    const minInput = document.querySelector('input[name="min"]');
    const maxInput = document.querySelector('input[name="max"]');
    
    // Get the custom settings input if it exists
    const customInput = document.querySelector('input[name="custom"]');

    if (!addCheck || !subCheck || !mulCheck || !divCheck) {
      console.log('[Zetamac Trainer] Controls not found');
      return;
    }

    // First, uncheck all operations
    addCheck.checked = false;
    subCheck.checked = false;
    mulCheck.checked = false;
    divCheck.checked = false;

    // Handle different training types
    if (trainingType.type === 'specific_number') {
      // Training a specific number (like multiplication with 7s)
      const op = trainingType.operation;
      const num = trainingType.number;
      
      // Enable only the relevant operation
      if (op === '*') {
        mulCheck.checked = true;
        
        // Try to set custom problems for specific multiplication
        if (customInput) {
          // Generate custom problem set focusing on the specific number
          let customProblems = [];
          for (let i = 2; i <= 12; i++) {
            customProblems.push(num + ' × ' + i);
            customProblems.push(i + ' × ' + num);
          }
          customInput.value = customProblems.join(', ');
        } else if (minInput && maxInput) {
          // If no custom input, try to limit the range
          // This is a compromise - set range around the problem number
          minInput.value = Math.max(2, num - 2);
          maxInput.value = Math.min(12, num + 2);
        }
        
        console.log('[Zetamac Trainer] Set up multiplication training for', num);
      } else if (op === '/') {
        divCheck.checked = true;
        
        if (customInput) {
          // Generate division problems with specific divisor
          let customProblems = [];
          for (let i = 1; i <= 12; i++) {
            customProblems.push((num * i) + ' ÷ ' + num);
          }
          customInput.value = customProblems.join(', ');
        }
        
        console.log('[Zetamac Trainer] Set up division training for', num);
      }
      
    } else if (trainingType.type === 'borrow') {
      // Training subtraction with borrowing
      subCheck.checked = true;
      
      if (customInput) {
        // Generate subtraction problems that require borrowing
        let customProblems = [];
        // Generate problems where the ones digit of first number is less than second
        for (let tens = 2; tens <= 9; tens++) {
          for (let ones1 = 0; ones1 <= 4; ones1++) {
            for (let ones2 = ones1 + 1; ones2 <= 9; ones2++) {
              const num1 = tens * 10 + ones1;
              const num2 = (tens - 1) * 10 + ones2;
              if (num2 > 0 && num1 > num2) {
                customProblems.push(num1 + ' - ' + num2);
              }
            }
          }
        }
        // Randomly select a subset to avoid too many problems
        customProblems = customProblems.sort(() => Math.random() - 0.5).slice(0, 30);
        customInput.value = customProblems.join(', ');
      }
      
      console.log('[Zetamac Trainer] Set up borrowing practice');
      
    } else {
      // General operation training
      if (trainingType.operation === '-') subCheck.checked = true;
      else if (trainingType.operation === '*') mulCheck.checked = true;
      else if (trainingType.operation === '/') divCheck.checked = true;
      else if (trainingType.operation === '+') addCheck.checked = true;
      
      console.log('[Zetamac Trainer] Set up general training for', trainingType.operation);
    }
    
    // Click the start button if it exists
    const startButton = document.querySelector('button[type="submit"], button.start, a.button');
    if (startButton) {
      setTimeout(function() {
        startButton.click();
        console.log('[Zetamac Trainer] Auto-started game');
      }, 500);
    }
    
    // Clear the training goal
    chrome.storage.local.remove(['trainingGoal', 'trainingType']);
  }, 1000);
});