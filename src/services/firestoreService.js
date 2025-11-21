// src/services/firestoreService.js
import { db, auth } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  addDoc,
  orderBy,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// ======================
// 1. AUTH & USER PROFILE
// ======================

export const apiLogin = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const apiSignUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDocRef = doc(db, 'users', user.uid);
  const displayName = email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  // Initialize User Profile
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    streak: 1,
    lastLoginDate: new Date().toDateString(),
    testsCompleted: 0,
    overallAccuracy: 0,
    totalQuestions: 0,
    studyTimeMinutes: 0,
    rank: 0,
    totalUsers: 0,
    bookmarks: [],
    weeklyGoal: 200 // Default Weekly Goal
  });

  return userCredential;
};

export const apiLogout = () => {
  return signOut(auth);
};

export const getUserData = async (uid) => {
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};

export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export const updateUserGoal = async (uid, newGoal) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { weeklyGoal: newGoal });
};

export const updateUserProgress = async (uid, updates) => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, updates);
};

// ======================
// 2. GAMIFICATION
// ======================

export const updateStreak = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return 1;

    const userData = userSnap.data();
    const lastLoginDate = userData.lastLoginDate;
    const today = new Date().toDateString();

    if (lastLoginDate === today) {
      return userData.streak || 1;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    let newStreak = 1;

    if (lastLoginDate === yesterdayString) {
      newStreak = (userData.streak || 0) + 1;
    }

    await updateDoc(userRef, {
      lastLoginDate: today,
      streak: newStreak
    });

    return newStreak;
  } catch (error) {
    console.error("Error updating streak:", error);
    return 1;
  }
};

export const getMCQOfTheDay = async () => {
  try {
    const qCol = collection(db, 'questions');
    // Strictly filter for 'EPW Dams' only
    const q = query(qCol, where('q_source', '==', 'EPW Dams'), limit(20)); 
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    const questions = snapshot.docs.map(formatDoc).filter(q => q !== null);
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    return randomQ;
  } catch (error) {
    console.error("Error fetching daily MCQ:", error);
    return null;
  }
};

export const getLeaderboard = async (sortBy = 'testsCompleted') => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy(sortBy, 'desc'), limit(20));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

// ======================
// 3. FLASHCARDS CRUD
// ======================

export const getUserDecks = async (uid) => {
  try {
    const decksRef = collection(db, 'users', uid, 'flashcard_decks');
    const snapshot = await getDocs(decksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading decks:", error);
    return [];
  }
};

export const createUserDeck = async (uid, deckData) => {
  try {
    const decksRef = collection(db, 'users', uid, 'flashcard_decks');
    const docRef = await addDoc(decksRef, deckData);
    return { id: docRef.id, ...deckData };
  } catch (error) {
    console.error("Error creating deck:", error);
    throw error;
  }
};

export const updateUserDeck = async (uid, deckId, updatedData) => {
  try {
    const deckRef = doc(db, 'users', uid, 'flashcard_decks', deckId);
    await updateDoc(deckRef, updatedData);
  } catch (error) {
    console.error("Error updating deck:", error);
    throw error;
  }
};

export const deleteUserDeck = async (uid, deckId) => {
  try {
    const deckRef = doc(db, 'users', uid, 'flashcard_decks', deckId);
    await deleteDoc(deckRef);
  } catch (error) {
    console.error("Error deleting deck:", error);
    throw error;
  }
};

// ======================
// 4. METADATA & SUBJECTS
// ======================

export const getSubjects = async (sources = []) => {
  const allSubjects = [];
  
  for (const source of sources) {
    const collectionName = `metadata_${source.replace(/\s+/g, '')}_subjects`;
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      snapshot.forEach(doc => {
        const data = doc.data();
        allSubjects.push({
          name: doc.id,
          source: source,
          modules: data.modules || {},
          subtopics: data.subtopics || {},
          difficulties: data.difficulties || {},
          cognitiveSkills: data.cognitiveSkills || {}
        });
      });
    } catch (error) {
      console.error(`Error fetching subjects for ${source}:`, error);
    }
  }
  
  return allSubjects;
};

// ======================
// 5. ANALYTICS, PREDICTIVE & ADAPTIVE ENGINE
// ======================

export const getPeerBenchmarks = async () => {
  return {
    'All Sources': { predictedScore: '1000 - 1100', highImpactTopics: ['Neuro', 'GI', 'CVS'], overallAccuracy: 85 },
    'Marrow': { predictedScore: '1050 - 1150', highImpactTopics: ['Neuro', 'GI', 'Obgyn'], overallAccuracy: 90 },
    'Prepladder': { predictedScore: '980 - 1080', highImpactTopics: ['CVS', 'Renal', 'Psm'], overallAccuracy: 82 },
    'Cerebellum': { predictedScore: '900 - 1000', highImpactTopics: ['Biochem', 'Micro', 'Pharma'], overallAccuracy: 78 },
    'EPWDAMS': { predictedScore: '920 - 1020', highImpactTopics: ['Anatomy', 'Pharma', 'Patho'], overallAccuracy: 80 },
  };
};

export const getAdaptiveTestStrategy = async (uid) => {
  try {
    const { subjectStats } = await getDetailedAnalytics(uid) || { subjectStats: {} };
    
    const subjects = Object.keys(subjectStats).map(sub => ({
      name: sub,
      accuracy: subjectStats[sub].total > 0 
        ? (subjectStats[sub].correct / subjectStats[sub].total) * 100 
        : 0,
      total: subjectStats[sub].total
    }));

    const weaknesses = subjects
      .filter(s => s.total >= 5 && s.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    if (weaknesses.length === 0) {
      return {
        mode: 'General',
        focusSubjects: null,
        reason: "Not enough data yet. We'll give you a balanced mix to establish a baseline."
      };
    }

    return {
      mode: 'Targeted',
      focusSubjects: weaknesses.map(w => w.name),
      reason: `Your accuracy in ${weaknesses.map(w => w.name).join(', ')} is below 70%.`
    };

  } catch (error) {
    console.error("Error generating strategy:", error);
    return { mode: 'Error', focusSubjects: null, reason: "Could not analyze data." };
  }
};

export const getTopicStats = async (uid, subjectName) => {
  try {
    const historyRef = collection(db, 'users', uid, 'test_history');
    const snapshot = await getDocs(historyRef);
    const history = snapshot.docs.map(d => d.data());
    let correct = 0;
    let total = 0;
    history.forEach(test => {
      if (test.subjectBreakdown && test.subjectBreakdown[subjectName]) {
        correct += test.subjectBreakdown[subjectName].correct;
        total += test.subjectBreakdown[subjectName].total;
      }
    });
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const qRef = collection(db, 'questions');
    const qQuery = query(qRef, where('subject', '==', subjectName));
    const qSnap = await getDocs(qQuery);
    return { userAccuracy: accuracy, totalQuestionsAvailable: qSnap.size, questionsAttempted: total };
  } catch (error) {
    return { userAccuracy: 0, totalQuestionsAvailable: 0, questionsAttempted: 0 };
  }
};

export const getDetailedAnalytics = async (uid) => {
  try {
    const historyRef = collection(db, 'users', uid, 'test_history');
    const snapshot = await getDocs(historyRef);
    const history = snapshot.docs.map(d => d.data());

    const sourceStats = {};
    const subjectStats = {};
    const cognitiveStats = {};
    const timeStats = {};
    let weeklyQs = 0;

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0,0,0,0);

    history.forEach(test => {
      if (new Date(test.timestamp) > startOfWeek) {
        weeklyQs += (test.totalScore / 4 || 0);
      }

      let source = 'Unknown';
      const title = (test.testTitle || '').toLowerCase();
      const rawSource = (test.source || '').toLowerCase();
      
      if (rawSource.includes('marrow') || title.includes('marrow')) source = 'Marrow';
      else if (rawSource.includes('prep') || title.includes('prep')) source = 'Prepladder';
      else if (rawSource.includes('cerebellum') || title.includes('cerebellum')) source = 'Cerebellum';
      else if (rawSource.includes('dams') || title.includes('epw')) source = 'EPWDAMS';

      if (!sourceStats[source]) sourceStats[source] = { correct: 0, total: 0 };
      sourceStats[source].correct += (test.correct || 0);
      sourceStats[source].total += (test.totalScore / 4 || 0); 

      if (test.subjectBreakdown) {
        Object.entries(test.subjectBreakdown).forEach(([sub, stats]) => {
           if (!subjectStats[sub]) subjectStats[sub] = { correct: 0, total: 0, time: 0, count: 0 };
           subjectStats[sub].correct += stats.correct;
           subjectStats[sub].total += stats.total;
           
           if (test.timeTaken && test.totalScore) {
              const qCount = test.totalScore / 4;
              const timePerQ = test.timeTaken / qCount;
              subjectStats[sub].time += (stats.total * timePerQ);
           }
        });
      }

      if (test.cognitiveBreakdown) {
        Object.entries(test.cognitiveBreakdown).forEach(([skill, stats]) => {
           const cleanSkill = skill || 'Recall';
           if (!cognitiveStats[cleanSkill]) cognitiveStats[cleanSkill] = { correct: 0, total: 0 };
           cognitiveStats[cleanSkill].correct += stats.correct;
           cognitiveStats[cleanSkill].total += stats.total;
        });
      }
    });
    
    Object.keys(subjectStats).forEach(sub => {
        if (subjectStats[sub].count > 0) {
            subjectStats[sub].totalTimePerQ = Math.round(subjectStats[sub].time / subjectStats[sub].count);
        } else {
            subjectStats[sub].totalTimePerQ = 0;
        }
    });

    return { sourceStats, subjectStats, cognitiveStats, timeStats: subjectStats, history, weeklyQs };
  } catch (error) {
    console.error("Error calculating analytics:", error);
    return null;
  }
};

// ======================
// 6. GRAND TESTS & HISTORY
// ======================

export const getGrandTests = async () => {
  try {
    const gtCol = collection(db, 'grand_tests');
    const snapshot = await getDocs(gtCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching grand tests:', error);
    return [];
  }
};

export const saveGrandTestResult = async (uid, resultData) => {
  try {
    const historyRef = collection(db, 'users', uid, 'test_history');
    await addDoc(historyRef, { ...resultData, timestamp: new Date().toISOString(), type: 'grand_test' });
    const userRef = doc(db, 'users', uid);
    const timeSpentMinutes = resultData.timeTaken ? Math.round(resultData.timeTaken / 60) : Math.round(resultData.totalScore / 4); 
    await updateDoc(userRef, { 
        testsCompleted: increment(1),
        totalQuestions: increment(resultData.totalScore / 4),
        studyTimeMinutes: increment(timeSpentMinutes)
    });
  } catch (error) {
    console.error("Error saving test result:", error);
  }
};

export const getGrandTestHistory = async (uid) => {
  try {
    const historyRef = collection(db, 'users', uid, 'test_history');
    const q = query(historyRef, where('type', '==', 'grand_test'), orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
  } catch (error) {
    return [];
  }
};

// ======================
// 7. UGC & MNEMONICS
// ======================

export const getCommunityMnemonics = async () => {
  try {
    const mnemonicsRef = collection(db, 'public_mnemonics');
    const q = query(mnemonicsRef, orderBy('votes', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const submitPublicMnemonic = async (mnemonicData) => {
  try {
    const mnemonicsRef = collection(db, 'public_mnemonics');
    await addDoc(mnemonicsRef, { ...mnemonicData, votes: 0, createdAt: new Date().toISOString() });
  } catch (error) {
    throw error;
  }
};

// ======================
// 8. CLINICAL SIMULATIONS & AI
// ======================

export const getClinicalCases = async () => {
  try {
    const casesRef = collection(db, 'clinical_cases');
    const snapshot = await getDocs(casesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const seedClinicalCase = async () => {
  try {
    // CORRECTED SEQUENTIAL INDEXING (0 -> 1 -> 2 for success)
    const caseData = {
      title: 'Acute Chest Pain in 55-Year-Old Male',
      source: 'Marrow Clinicals',
      subject: 'Medicine',
      difficulty: 'Hard',
      description: 'A 55-year-old male presents to the ER with crushing substernal chest pain.',
      steps: [
        // Index 0: Start
        { 
          title: 'Initial Presentation', 
          prompt: "Patient is sweating, anxious. BP 160/95, HR 102. History of HTN.<br/><br/>**Immediate action?**", 
          action: 'Choose Management', 
          options: [ 
            { label: 'Nitroglycerin & Aspirin (Correct)', nextStep: 1 }, // Go to Index 1
            { label: 'CT Pulmonary Angio (Wrong)', nextStep: 3 }, // Go to Index 3 (Branch)
            { label: 'Antacids (Wrong)', nextStep: 4 } // Go to Index 4
          ] 
        },
        // Index 1: Correct Path Step 2
        { 
          title: 'ECG Findings', 
          prompt: "Pain persists mildy. <br/>**ECG shows ST elevation in II, III, aVF.** <br/><br/>Diagnosis?", 
          action: 'Diagnose', 
          options: [ 
            { label: 'Inferior Wall MI (Correct)', nextStep: 2 }, // Go to Index 2
            { label: 'Anterior Wall MI (Wrong)', nextStep: 4 }, 
            { label: 'Pericarditis (Wrong)', nextStep: 4 } 
          ] 
        },
        // Index 2: Correct Path Step 3
        { 
          title: 'Treatment Plan', 
          prompt: "Correct. Inferior Wall MI. <br/><br/>**Definitive management?**", 
          action: 'Select Treatment', 
          options: [ 
            { label: 'Thrombolysis / PCI (Correct)', nextStep: 100 }, // Success
            { label: 'Observation (Wrong)', nextStep: 99 } // Fail
          ] 
        },
        // Index 3: Wrong Path A
        { 
          title: 'Incorrect Path', 
          prompt: "Patient deteriorates. Re-evaluate clinical approach.", 
          action: 'Try Again', 
          options: [ { label: 'Restart Case', nextStep: 0 } ] 
        },
        // Index 4: Wrong Path B
        { 
          title: 'Wrong Diagnosis', 
          prompt: "ECG leads don't support that. Review lead distribution.", 
          action: 'Re-evaluate', 
          options: [ { label: 'Back to ECG', nextStep: 1 } ] 
        }
      ]
    };
    await addDoc(collection(db, 'clinical_cases'), caseData);
    return true;
  } catch (error) { return false; }
};

export const generateAICase = async (topic) => {
  try {
    // UPDATED PROMPT: Strict JSON keys to ensure "prompt" is always present
    const systemPrompt = `You are a medical educator. Create a clinical case on "${topic}". 
    Output VALID JSON. Structure:
    {
      "title": "Case Title", 
      "source": "AI Simulation", 
      "subject": "${topic}", 
      "description": "Brief summary", 
      "steps": [
        {
          "title": "Step Title (e.g. Initial Presentation)",
          "prompt": "HTML formatted scenario text. Describe patient vitals, symptoms, etc.",
          "action": "Short label for decision button (e.g. Choose Diagnosis)",
          "options": [ { "label": "Option A", "nextStep": 1 } ]
        }
      ]
    }
    
    CRITICAL RULES:
    1. Every step MUST have a "prompt" field. Do NOT use "description" or "text".
    2. The correct path MUST be sequential indices: Index 0 -> Index 1 -> Index 2 -> 100.
    3. Use "nextStep": 99 for failure, 100 for success.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, 'Content-Type': 'application/json', },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Generate a high-yield case on ${topic}` }],
        temperature: 0.5, max_tokens: 3000, response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error("AI API Error");
    const data = await response.json();
    let parsedData = JSON.parse(data.choices[0].message.content);

    // DATA SANITIZATION: Ensure every step has a 'prompt'
    if(parsedData.steps && Array.isArray(parsedData.steps)){
        parsedData.steps = parsedData.steps.map(step => ({
            ...step,
            // Fallback: If AI put prompt in 'description' or 'text', use that.
            prompt: step.prompt || step.description || step.text || "Scenario details missing.",
            action: step.action || "Make Decision"
        }));
    }

    return parsedData;
  } catch (error) {
    console.error("Error generating AI case:", error);
    return null;
  }
};

// ======================
// 9. SEMANTIC SEARCH & STUDY PLANNER
// ======================

export const generateStudyPlan = async (uid, examDate, dailyHours) => {
  try {
    const strategy = await getAdaptiveTestStrategy(uid);
    const weakAreas = strategy.focusSubjects ? strategy.focusSubjects.join(", ") : "General Revision";
    const today = new Date();
    const exam = new Date(examDate);
    const daysLeft = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { error: "Exam date must be in the future." };

    const systemPrompt = `Create a ${daysLeft}-day study schedule. Weak Areas: ${weakAreas}. Daily Time: ${dailyHours} hours. JSON: { "plan": [ { "day": 1, "date": "Day 1", "focus": "Subject", "tasks": ["Task 1"] } ], "summary": "Brief summary." }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: "Generate my plan." }],
        temperature: 0.7, max_tokens: 2048, response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) throw new Error("AI API Error");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);

  } catch (error) {
    console.error("Error generating plan:", error);
    return null;
  }
};

export const smartSearchQuestions = async (userQuery) => {
  if (!userQuery || userQuery.length < 2) return [];
  try {
    const systemPrompt = `Analyze search query. Return JSON: { "subject": "SubjectNameOrNull", "keyword": "MainKeyword" }`;
    let searchParams = { subject: null, keyword: userQuery.toLowerCase() };
    try {
      const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }],
          temperature: 0.1, max_tokens: 100, response_format: { type: 'json_object' }
        })
      });
      if (aiRes.ok) {
        const data = await aiRes.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        if (parsed.keyword) searchParams.keyword = parsed.keyword.toLowerCase();
        if (parsed.subject && parsed.subject !== "null") searchParams.subject = parsed.subject;
      }
    } catch (e) {}

    const qCol = collection(db, 'questions');
    let constraints = [limit(50)];
    if (searchParams.subject) constraints.push(where('subject', '==', searchParams.subject));
    const q = query(qCol, ...constraints);
    const snapshot = await getDocs(q);

    const rawResults = snapshot.docs.map(formatDoc).filter(q => q !== null);
    return rawResults.filter(q => {
       const text = (q.question + ' ' + q.explanation + ' ' + q.keywords).toLowerCase();
       return text.includes(searchParams.keyword) || text.includes(userQuery.toLowerCase());
    });
  } catch (error) { return []; }
};

// ======================
// 10. CORE UTILS
// ======================

function formatDoc(docSnap) {
  const data = docSnap.data();
  if (!data) return null;
  return {
    id: data.id || docSnap.id,
    question: data.question_text || '',
    options: [ data.options?.A || '', data.options?.B || '', data.options?.C || '', data.options?.D || '' ],
    answer: data.correct_answer ? data.correct_answer.charCodeAt(0) - 64 : 1,
    subject: data.subject || '',
    subtopic: data.subtopic || '',
    module: data.module || '',
    source: data.q_source || '',
    cognitive_skill: data.cognitive_skill || 'Recall', 
    keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : '',
    questionImage: (data.images && data.images.length > 0) ? data.images[0] : null,
    explanation: data.explanation || ''
  };
}

export const getQuestions = async (filters = {}) => {
  const { subject, modules, subtopics, difficulty, cognitiveSkill, sources, count, isGrandTest } = filters;
  if (!count || count <= 0) return [];
  const qCol = collection(db, 'questions');
  let q = query(qCol);
  if (!isGrandTest) {
    if (subject) q = query(q, where('subject', '==', subject));
    if (modules && modules.length > 0 && modules.length <= 10) q = query(q, where('module', 'in', modules));
    if (subtopics && subtopics.length > 0 && subtopics.length <= 10) q = query(q, where('subtopic', 'in', subtopics));
    if (difficulty) q = query(q, where('difficulty', '==', difficulty));
    if (cognitiveSkill) q = query(q, where('cognitive_skill', '==', cognitiveSkill));
    if (sources && sources.length > 0 && sources.length <= 10) q = query(q, where('q_source', 'in', sources));
  }
  const fetchLimit = Math.max(1, Math.min(count * 3, 500));
  q = query(q, limit(fetchLimit));
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    const allQuestions = snapshot.docs.map(formatDoc).filter(q => q !== null);
    return allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
  } catch (error) { return []; }
};

export const getQuestionsByIds = async (ids = []) => {
  if (!ids || ids.length === 0) return [];
  const uniqueIds = [...new Set(ids)];
  try {
    const promises = uniqueIds.map(id => getDoc(doc(db, 'questions', id)));
    const snapshots = await Promise.all(promises);
    let foundQuestions = snapshots.map(formatDoc).filter(q => q !== null);
    const missingCount = uniqueIds.length - foundQuestions.length;

    if (missingCount > uniqueIds.length * 0.1) {
      const allQQuery = query(collection(db, 'questions'), limit(2000)); 
      const allQSnap = await getDocs(allQQuery);
      const allDBQuestions = allQSnap.docs.map(formatDoc).filter(q => q !== null);
      const foundIds = new Set(foundQuestions.map(q => q.id));
      const missingIds = uniqueIds.filter(id => !foundIds.has(id));
      missingIds.forEach(missingId => {
        const match = allDBQuestions.find(q => q.id?.includes(missingId) || missingId.includes(q.id));
        if (match && !foundIds.has(match.id)) { foundQuestions.push(match); foundIds.add(match.id); }
      });
    }

    if (foundQuestions.length < uniqueIds.length / 2) {
      let targetSource = 'Cerebellum';
      const firstId = (uniqueIds[0] || '').toLowerCase();
      if (firstId.includes('marrow')) targetSource = 'Marrow';
      else if (firstId.includes('prepladder')) targetSource = 'Prepladder';
      else if (firstId.includes('epwdams') || firstId.includes('dams')) targetSource = 'Epwdams';
      else if (firstId.includes('cerebellum')) targetSource = 'Cerebellum';
      const fallbackQuery = query(collection(db, 'questions'), where('q_source', '==', targetSource), limit(uniqueIds.length));
      const fallbackSnap = await getDocs(fallbackQuery);
      const fallbackQuestions = fallbackSnap.docs.map(formatDoc).filter(q => q !== null);
      if (fallbackQuestions.length > 0) return fallbackQuestions.sort(() => Math.random() - 0.5);
    }
    return Array.from(new Map(foundQuestions.map(q => [q.id, q])).values());
  } catch (error) { return []; }
};

export const getMistakeNotebook = async (uid) => {
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) return userSnap.data().bookmarks || [];
  return [];
};

export const addBookmark = async (uid, questionId) => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { bookmarks: arrayUnion(questionId) });
};

export const removeBookmark = async (uid, questionId) => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { bookmarks: arrayRemove(questionId) });
};

// CENTRAL AI FUNCTION (Supports Model Selection)
export const getGroqCompletion = async (systemPrompt, userPrompt, schema = null, model = 'llama-3.3-70b-versatile') => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, 
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ],
        temperature: 0.7,
        max_tokens: 2048,
        ...(schema && { response_format: { type: 'json_object' } })
      })
    });
    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};