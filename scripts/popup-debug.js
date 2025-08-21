// popup-debug.js - Debug version with extensive error handling

console.log('[Debug Popup] Script starting...');

// Wrap everything in try-catch
try {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[Debug Popup] DOM loaded, fetching data...');
    
    // First, let's check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      document.getElementById('data-summary').innerHTML = '<div class="error">Chrome storage API not available!</div>';
      return;
    }
    
    chrome.storage.local.get({ results: [] }, function(data) {
      console.log('[Debug Popup] Data retrieved:', data);
      
      try {
        const results = data.results || [];
        
        // ===== DATA SUMMARY =====
        const summaryDiv = document.getElementById('data-summary');
        if (!summaryDiv) {
          console.error('Summary div not found!');
          return;
        }
        
        let summaryHTML = '<div class="info">Total Problems Tracked: <strong>' + results.length + '</strong></div>';
        
        if (results.length === 0) {
          summaryHTML += '<div class="warning">No data found! Make sure to play some games first.</div>';
          summaryDiv.innerHTML = summaryHTML;
          
          // Clear other sections
          document.getElementById('operator-debug').innerHTML = '<div class="warning">No data to analyze</div>';
          document.getElementById('number-debug').innerHTML = '<div class="warning">No data to analyze</div>';
          document.getElementById('pattern-debug').innerHTML = '<div class="warning">No data to analyze</div>';
          document.getElementById('recent-problems').innerHTML = '<div class="warning">No problems tracked yet</div>';
          return;
        }
        
        if (results.length < 10) {
          summaryHTML += '<div class="warning">Need at least 10 problems for analysis</div>';
        } else if (results.length < 50) {
          summaryHTML += '<div class="info">More data will improve accuracy</div>';
        } else {
          summaryHTML += '<div class="success">Good amount of data collected</div>';
        }
        
        summaryDiv.innerHTML = summaryHTML;
        
        // ===== OPERATOR DETAILED STATS =====
        try {
          const operatorStats = analyzeByOperatorDetailed(results);
          let opTableHTML = '<table class="stats-table">';
          opTableHTML += '<tr><th>Operation</th><th>Count</th><th>Avg Time (ms)</th><th>Min</th><th>Max</th></tr>';
          
          const opOrder = ['+', '-', '*', '/'];
          let hasAnyOps = false;
          
          opOrder.forEach(function(op) {
            if (operatorStats[op] && operatorStats[op].count > 0) {
              hasAnyOps = true;
              const stat = operatorStats[op];
              opTableHTML += '<tr>';
              opTableHTML += '<td>' + getOperationName(op) + '</td>';
              opTableHTML += '<td>' + stat.count + '</td>';
              opTableHTML += '<td><strong>' + Math.round(stat.avg) + '</strong></td>';
              opTableHTML += '<td>' + Math.round(stat.min) + '</td>';
              opTableHTML += '<td>' + Math.round(stat.max) + '</td>';
              opTableHTML += '</tr>';
            }
          });
          
          if (!hasAnyOps) {
            opTableHTML += '<tr><td colspan="5">No operations found - check problem format</td></tr>';
          }
          
          opTableHTML += '</table>';
          
          // Find slowest operation
          let slowestOp = null;
          let slowestAvg = 0;
          Object.keys(operatorStats).forEach(function(op) {
            if (operatorStats[op].count > 0 && operatorStats[op].avg > slowestAvg) {
              slowestAvg = operatorStats[op].avg;
              slowestOp = op;
            }
          });
          
          if (slowestOp) {
            opTableHTML += '<div class="info">Actual slowest: <strong>' + getOperationName(slowestOp) + '</strong> at ' + Math.round(slowestAvg) + 'ms average</div>';
          }
          
          document.getElementById('operator-debug').innerHTML = opTableHTML;
        } catch (e) {
          console.error('Error in operator analysis:', e);
          document.getElementById('operator-debug').innerHTML = '<div class="error">Error analyzing operators: ' + e.message + '</div>';
        }
        
        // ===== NUMBER STATS =====
        try {
          const numberStats = analyzeByNumberDetailed(results);
          const sortedNumbers = Object.entries(numberStats)
            .sort(function(a, b) { return b[1].avg - a[1].avg; })
            .slice(0, 10);
          
          let numTableHTML = '<table class="stats-table">';
          numTableHTML += '<tr><th>Number</th><th>Count</th><th>Avg Time (ms)</th></tr>';
          
          sortedNumbers.forEach(function(entry) {
            const num = entry[0];
            const stat = entry[1];
            numTableHTML += '<tr>';
            numTableHTML += '<td>' + num + '</td>';
            numTableHTML += '<td>' + stat.count + '</td>';
            numTableHTML += '<td><strong>' + Math.round(stat.avg) + '</strong></td>';
            numTableHTML += '</tr>';
          });
          
          numTableHTML += '</table>';
          document.getElementById('number-debug').innerHTML = numTableHTML;
        } catch (e) {
          console.error('Error in number analysis:', e);
          document.getElementById('number-debug').innerHTML = '<div class="error">Error analyzing numbers: ' + e.message + '</div>';
        }
        
        // ===== PATTERN ANALYSIS DEBUG =====
        try {
          const patternResult = analyzeByPatternDebug(results);
          let patternHTML = '<div class="info">Pattern Detection Results:</div>';
          
          // Show debug info
          patternHTML += '<pre>Debug Info:\n';
          patternHTML += 'Total Problems: ' + patternResult.debug.totalProblems + '\n';
          patternHTML += 'Multiplication Problems: ' + patternResult.debug.multiplicationProblems + '\n';
          patternHTML += 'Division Problems: ' + patternResult.debug.divisionProblems + '\n';
          patternHTML += 'Subtraction with Borrow: ' + patternResult.debug.subtractionWithBorrow + '\n';
          patternHTML += 'Unmatched Problems: ' + patternResult.debug.unmatchedProblems + '</pre>';
          
          if (Object.keys(patternResult.patterns).length === 0) {
            patternHTML += '<div class="warning">No patterns detected! Check the sample problems below.</div>';
          } else {
            patternHTML += '<table class="stats-table">';
            patternHTML += '<tr><th>Pattern</th><th>Count</th><th>Avg Time</th></tr>';
            
            Object.entries(patternResult.patterns).forEach(function(entry) {
              const pattern = entry[0];
              const stat = entry[1];
              patternHTML += '<tr>';
              patternHTML += '<td>' + getPatternName(pattern) + '</td>';
              patternHTML += '<td>' + stat.c + '</td>';
              patternHTML += '<td>' + Math.round(stat.t / stat.c) + 'ms</td>';
              patternHTML += '</tr>';
            });
            patternHTML += '</table>';
          }
          
          // Show sample problems
          if (patternResult.debug.samples.length > 0) {
            patternHTML += '<div style="margin-top:10px">Sample problems analyzed:</div>';
            patternHTML += '<div class="problem-list">';
            patternResult.debug.samples.forEach(function(sample) {
              if (sample.status === 'NO_MATCH') {
                patternHTML += sample.problem + ' --> NO MATCH!<br>';
              } else {
                patternHTML += sample.problem + ' --> Op: "' + sample.parsed.op + '"<br>';
              }
            });
            patternHTML += '</div>';
          }
          
          document.getElementById('pattern-debug').innerHTML = patternHTML;
        } catch (e) {
          console.error('Error in pattern analysis:', e);
          document.getElementById('pattern-debug').innerHTML = '<div class="error">Error analyzing patterns: ' + e.message + '</div>';
        }
        
        // ===== RECENT PROBLEMS =====
        try {
          const recentProblems = results.slice(-20).reverse();
          let recentHTML = '<div class="problem-list">';
          recentProblems.forEach(function(r) {
            recentHTML += r.problem + ' --> ' + Math.round(r.time) + 'ms<br>';
          });
          recentHTML += '</div>';
          document.getElementById('recent-problems').innerHTML = recentHTML;
        } catch (e) {
          console.error('Error showing recent problems:', e);
          document.getElementById('recent-problems').innerHTML = '<div class="error">Error: ' + e.message + '</div>';
        }
        
        // ===== ORIGINAL ANALYSIS =====
        if (results.length >= 10) {
          try {
            runOriginalAnalysis(results);
          } catch (e) {
            console.error('Error in original analysis:', e);
          }
        }
        
      } catch (error) {
        console.error('[Debug Popup] Error processing data:', error);
        document.getElementById('data-summary').innerHTML = '<div class="error">Error processing data: ' + error.message + '</div>';
      }
    });
  });
} catch (error) {
  console.error('[Debug Popup] Top-level error:', error);
}

// Analysis functions
function analyzeByOperatorDetailed(results) {
  const stats = {
    '+': { count: 0, total: 0, min: Infinity, max: 0, avg: 0 },
    '-': { count: 0, total: 0, min: Infinity, max: 0, avg: 0 },
    '*': { count: 0, total: 0, min: Infinity, max: 0, avg: 0 },
    '/': { count: 0, total: 0, min: Infinity, max: 0, avg: 0 }
  };
  
  results.forEach(function(result) {
    // Try multiple regex patterns to catch different formats
    let match = result.problem.match(/(\d+)\s*([×÷+\-x*\/])\s*(\d+)/);
    if (!match) {
      // Try with special dash character
      match = result.problem.match(/(\d+)\s*([×÷+–x*\/])\s*(\d+)/);
    }
    if (!match) {
      // Try with any non-digit character as operator
      match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    }
    
    if (match) {
      const op = normalizeOperator(match[2]);
      if (stats[op]) {
        stats[op].count++;
        stats[op].total += result.time;
        stats[op].min = Math.min(stats[op].min, result.time);
        stats[op].max = Math.max(stats[op].max, result.time);
      }
    }
  });
  
  // Calculate averages
  Object.keys(stats).forEach(function(op) {
    if (stats[op].count > 0) {
      stats[op].avg = stats[op].total / stats[op].count;
    }
    if (stats[op].min === Infinity) {
      stats[op].min = 0;
    }
  });
  
  return stats;
}

function analyzeByNumberDetailed(results) {
  const stats = {};
  
  results.forEach(function(result) {
    let match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    if (!match) return;
    
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[3], 10);
    
    [n1, n2].forEach(function(num) {
      if (!stats[num]) {
        stats[num] = { count: 0, total: 0, avg: 0 };
      }
      stats[num].count++;
      stats[num].total += result.time;
    });
  });
  
  // Calculate averages
  Object.keys(stats).forEach(function(num) {
    if (stats[num].count > 0) {
      stats[num].avg = stats[num].total / stats[num].count;
    }
  });
  
  return stats;
}

function analyzeByPatternDebug(results) {
  const patterns = {};
  const debug = {
    totalProblems: results.length,
    multiplicationProblems: 0,
    divisionProblems: 0,
    subtractionWithBorrow: 0,
    unmatchedProblems: 0,
    samples: []
  };
  
  results.forEach(function(result, index) {
    let match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    
    if (!match) {
      debug.unmatchedProblems++;
      if (debug.samples.length < 5) {
        debug.samples.push({ problem: result.problem, status: 'NO_MATCH' });
      }
      return;
    }
    
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[3], 10);
    const op = normalizeOperator(match[2]);
    
    // Add to samples
    if (debug.samples.length < 10) {
      debug.samples.push({
        problem: result.problem,
        parsed: { n1: n1, op: op, n2: n2 }
      });
    }
    
    if (op === '*') {
      debug.multiplicationProblems++;
      // Track both numbers
      [n1, n2].forEach(function(num) {
        if (num >= 2 && num <= 12) {
          const key = '*_' + num;
          if (!patterns[key]) patterns[key] = { c: 0, t: 0 };
          patterns[key].c++;
          patterns[key].t += result.time;
        }
      });
    } else if (op === '/') {
      debug.divisionProblems++;
      // Track divisor
      if (n2 >= 2 && n2 <= 12) {
        const key = '/_' + n2;
        if (!patterns[key]) patterns[key] = { c: 0, t: 0 };
        patterns[key].c++;
        patterns[key].t += result.time;
      }
    } else if (op === '-' && (n1 % 10 < n2 % 10)) {
      debug.subtractionWithBorrow++;
      const key = 'sub_borrow';
      if (!patterns[key]) patterns[key] = { c: 0, t: 0 };
      patterns[key].c++;
      patterns[key].t += result.time;
    }
  });
  
  return { patterns: patterns, debug: debug };
}

// Helper functions
function normalizeOperator(opSymbol) {
  if (opSymbol === '×' || opSymbol === 'x' || opSymbol === 'X') return '*';
  if (opSymbol === '÷') return '/';
  if (opSymbol === '–' || opSymbol === '-' || opSymbol === '−') return '-';
  if (opSymbol === '+') return '+';
  return opSymbol;
}

function getOperationName(op) {
  const names = {
    '+': 'Addition',
    '-': 'Subtraction',
    '*': 'Multiplication',
    '/': 'Division'
  };
  return names[op] || 'Unknown';
}

function getPatternName(key) {
  if (key === 'sub_borrow') return 'Subtraction (with Borrowing)';
  const parts = key.split('_');
  if (parts.length === 2) {
    const opName = getOperationName(parts[0]);
    return opName + ' with ' + parts[1] + 's';
  }
  return key;
}

// Original analysis functions
function analyzeByOperator(results) {
  const stats = { '+': { c: 0, t: 0 }, '-': { c: 0, t: 0 }, '*': { c: 0, t: 0 }, '/': { c: 0, t: 0 } };
  results.forEach(function(result) {
    const match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    if (match) {
      const op = normalizeOperator(match[2]);
      if (stats[op]) {
        stats[op].c++;
        stats[op].t += result.time;
      }
    }
  });
  return stats;
}

function analyzeByNumber(results) {
  const stats = {};
  results.forEach(function(result) {
    const match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    if (!match) return;
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[3], 10);
    
    [n1, n2].forEach(function(num) {
      if (!stats[num]) stats[num] = { c: 0, t: 0 };
      stats[num].c++;
      stats[num].t += result.time;
    });
  });
  return stats;
}

function analyzeByPattern(results) {
  const stats = {};
  results.forEach(function(result) {
    const match = result.problem.match(/(\d+)\s*(\S)\s*(\d+)/);
    if (!match) return;
    
    const n1 = parseInt(match[1], 10);
    const n2 = parseInt(match[3], 10);
    const op = normalizeOperator(match[2]);
    
    if (op === '*' || op === '/') {
      [n1, n2].forEach(function(num) {
        if (num >= 2 && num <= 12) {
          const key = op + '_' + num;
          if (!stats[key]) stats[key] = { c: 0, t: 0 };
          stats[key].c++;
          stats[key].t += result.time;
        }
      });
    }
    
    if (op === '-' && (n1 % 10 < n2 % 10)) {
      const key = 'sub_borrow';
      if (!stats[key]) stats[key] = { c: 0, t: 0 };
      stats[key].c++;
      stats[key].t += result.time;
    }
  });
  return stats;
}

function findSlowest(stats, minOccurrences) {
  minOccurrences = minOccurrences || 1;
  let slowest = null;
  let maxAvg = -1;
  
  Object.keys(stats).forEach(function(key) {
    const item = stats[key];
    if (item.c >= minOccurrences) {
      const avg = item.t / item.c;
      if (avg > maxAvg) {
        maxAvg = avg;
        slowest = { name: key, average: avg };
      }
    }
  });
  
  return slowest;
}

function runOriginalAnalysis(results) {
  const operatorStats = analyzeByOperator(results);
  const slowestOp = findSlowest(operatorStats);
  if (slowestOp) {
    const opMsg = 'Slowest Operation: <strong>' + getOperationName(slowestOp.name) + '</strong><br>Avg Time: <strong>' + Math.round(slowestOp.average) + ' ms</strong>';
    document.getElementById('operator-analysis-text').innerHTML = opMsg;
  }
  
  const numberStats = analyzeByNumber(results);
  const troubleNum = findSlowest(numberStats, 3);
  if (troubleNum) {
    const numMsg = 'Trouble Number: <strong>' + troubleNum.name + '</strong><br>Avg Time: <strong>' + Math.round(troubleNum.average) + ' ms</strong>';
    document.getElementById('number-analysis-text').innerHTML = numMsg;
  }
  
  const patternStats = analyzeByPattern(results);
  const troublePattern = findSlowest(patternStats, 3);
  if (troublePattern) {
    const patMsg = 'Specific Weakness: <strong>' + getPatternName(troublePattern.name) + '</strong><br>Avg Time: <strong>' + Math.round(troublePattern.average) + ' ms</strong>';
    document.getElementById('pattern-analysis-text').innerHTML = patMsg;
    
    // Enable and setup the train button
    const trainBtn = document.getElementById('train-btn');
    if (trainBtn) {
      trainBtn.disabled = false;
      
      // Remove any existing listeners by cloning
      const newBtn = trainBtn.cloneNode(true);
      trainBtn.parentNode.replaceChild(newBtn, trainBtn);
      
      // Add click listener
      newBtn.addEventListener('click', function() {
        console.log('[Debug] Training button clicked for pattern:', troublePattern.name);
        chrome.storage.local.set({ trainingGoal: troublePattern.name }, function() {
          console.log('[Debug] Training goal saved:', troublePattern.name);
          chrome.tabs.create({ url: 'https://arithmetic.zetamac.com/' });
        });
      });
    }
  } else {
    document.getElementById('pattern-analysis-text').innerHTML = 'Not enough data for pattern analysis.';
    const trainBtn = document.getElementById('train-btn');
    if (trainBtn) {
      trainBtn.disabled = true;
    }
  }
}

// Button handlers
document.addEventListener('DOMContentLoaded', function() {
  // Export JSON
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      chrome.storage.local.get({ results: [] }, function(data) {
        const blob = new Blob([JSON.stringify(data.results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zetamac-data-' + new Date().toISOString() + '.json';
        a.click();
      });
    });
  }
  
  // Export CSV
  const csvBtn = document.getElementById('export-csv-btn');
  if (csvBtn) {
    csvBtn.addEventListener('click', function() {
      chrome.storage.local.get({ results: [] }, function(data) {
        let csv = 'Problem,Time(ms),Timestamp\n';
        data.results.forEach(function(r) {
          csv += '"' + r.problem + '",' + Math.round(r.time) + ',' + r.timestamp + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zetamac-data-' + new Date().toISOString() + '.csv';
        a.click();
      });
    });
  }
  
  // Clear data
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear all tracked data? This cannot be undone.')) {
        chrome.storage.local.set({ results: [] }, function() {
          location.reload();
        });
      }
    });
  }
  
  // Test parser
  const testBtn = document.getElementById('analyze-sample');
  if (testBtn) {
    testBtn.addEventListener('click', function() {
      const testProblems = [
        '5 × 7', '12 ÷ 3', '45 - 28', '67 + 19',
        '8 x 9', '56 / 8', '23 – 17', '4 * 6'
      ];
      
      let output = 'Testing problem parsing:\n\n';
      testProblems.forEach(function(p) {
        const match = p.match(/(\d+)\s*(\S)\s*(\d+)/);
        if (match) {
          const normalized = normalizeOperator(match[2]);
          output += 'OK: "' + p + '" --> op:"' + match[2] + '" --> normalized:"' + normalized + '"\n';
        } else {
          output += 'FAIL: "' + p + '" --> NO MATCH\n';
        }
      });
      alert(output);
    });
  }
});