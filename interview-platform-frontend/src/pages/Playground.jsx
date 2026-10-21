import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CodeCompilerPlayground from '../components/compiler/CodeCompilerPlayground'

// Popular Interview Practice Problems
const FEATURED_CHALLENGES = [
  {
    id: 'two-sum',
    title: 'Two Sum (Hash Map)',
    company: 'Google / Meta',
    language: 'javascript',
    difficulty: 'EASY',
    description: 'Find two numbers that add up to target in O(n) time.',
    code: `// Two Sum Solution in JavaScript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

// Test Case 1
const nums1 = [2, 7, 11, 15];
const target1 = 9;
const result1 = twoSum(nums1, target1);
console.log("Test Case 1: nums = [2, 7, 11, 15], target = 9");
console.log("Indices Result:", result1);
console.log("Sum Check:", nums1[result1[0]] + " + " + nums1[result1[1]] + " = " + (nums1[result1[0]] + nums1[result1[1]]));

// Test Case 2
const nums2 = [3, 2, 4];
const target2 = 6;
const result2 = twoSum(nums2, target2);
console.log("\\nTest Case 2: nums = [3, 2, 4], target = 6");
console.log("Indices Result:", result2);
`,
  },
  {
    id: 'palindrome',
    title: 'Valid Palindrome (Two Pointer)',
    company: 'Amazon / Microsoft',
    language: 'python',
    difficulty: 'EASY',
    description: 'Check if alphanumeric characters form a palindrome in Python.',
    code: `# Valid Palindrome Solution in Python
def is_palindrome(s: str) -> bool:
    cleaned = ''.join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]

# Test Case 1
test1 = "A man, a plan, a canal: Panama"
print("Test 1:", test1)
print("Is Palindrome:", is_palindrome(test1))

# Test Case 2
test2 = "race a car"
print("\\nTest 2:", test2)
print("Is Palindrome:", is_palindrome(test2))

# Test Case 3
test3 = "Was it a car or a cat I saw?"
print("\\nTest 3:", test3)
print("Is Palindrome:", is_palindrome(test3))
`,
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Design (O(1) Get & Put)',
    company: 'Uber / Netflix',
    language: 'javascript',
    difficulty: 'MEDIUM',
    description: 'Design Least Recently Used cache with fast hash map lookups.',
    code: `// LRU Cache implementation using JavaScript Map (preserves insertion order)
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return -1;
        const val = this.cache.get(key);
        // Refresh key to MRU (most recently used) position
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            // Evict least recently used (first inserted entry)
            const lruKey = this.cache.keys().next().value;
            this.cache.delete(lruKey);
        }
        this.cache.set(key, value);
    }
}

// Verification run
const lru = new LRUCache(2);
lru.put(1, "Data 1");
lru.put(2, "Data 2");
console.log("Get Key 1:", lru.get(1)); // returns Data 1
lru.put(3, "Data 3"); // evicts key 2
console.log("Get Key 2 (Evicted):", lru.get(2)); // returns -1
console.log("Get Key 3:", lru.get(3)); // returns Data 3
`,
  },
  {
    id: 'binary-search',
    title: 'Binary Search (Log N Search)',
    company: 'Apple / Stripe',
    language: 'javascript',
    difficulty: 'EASY',
    description: 'Search a sorted array with logarithmic runtime.',
    code: `// Binary Search in JavaScript
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

const arr = [1, 3, 5, 7, 9, 11, 15, 19, 23];
console.log("Search 9 in [1, 3, 5, 7, 9, 11, 15, 19, 23]: Index =", binarySearch(arr, 9));
console.log("Search 100 in sorted list: Index =", binarySearch(arr, 100));
`,
  },
]

export function Playground() {
  const [selectedChallenge, setSelectedChallenge] = useState(FEATURED_CHALLENGES[0])

  return (
    <div className="container section" id="playground-page" style={{ maxWidth: '1020px' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            color: '#0284c7',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <span>⚡</span>
          <span>Code Playground</span>
        </div>

        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
          id="playground-heading"
        >
          Code Playground
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Run code, test solutions, and practice common interview questions directly in your browser.
        </p>
      </div>

      {/* Featured Challenge Selector Pills */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
          Practice Problems:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {FEATURED_CHALLENGES.map((ch) => {
            const isSelected = selectedChallenge.id === ch.id
            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChallenge(ch)}
                className="card"
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-medium)',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.06)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {ch.company}
                  </span>
                  <span
                    className={`badge badge-${ch.difficulty.toLowerCase()}`}
                    style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}
                  >
                    {ch.difficulty}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {ch.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {ch.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Embedded Live Code Playground Component */}
      <CodeCompilerPlayground
        key={selectedChallenge.id}
        initialLanguage={selectedChallenge.language}
        initialCode={selectedChallenge.code}
        initialTitle={selectedChallenge.title}
      />
    </div>
  )
}

export default Playground