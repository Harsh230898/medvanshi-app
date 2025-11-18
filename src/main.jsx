// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import all our providers
import { UIProvider } from './context/UIContext';
import { NotificationProvider } from './context/NotificationContext';
import { FlashcardProvider } from './context/FlashcardContext';
import { UGCProvider } from './context/UGCContext';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { PatientEncounterProvider } from './context/PatientEncounterContext';
import { AIChatProvider } from './context/AIChatContext';
import { MetadataProvider } from './context/MetadataContext'; // <-- IMPORT NEW PROVIDER

// Import the App component
import App from './App';

// Import the global stylesheet
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UIProvider>
      <NotificationProvider>
        <MetadataProvider> {/* <-- WRAP HERE */}
          <FlashcardProvider>
            <UGCProvider>
              <AuthProvider>
                <QuizProvider>
                  <PatientEncounterProvider>
                    <AIChatProvider>
                      <App />
                    </AIChatProvider>
                  </PatientEncounterProvider>
                </QuizProvider>
              </AuthProvider>
            </UGCProvider>
          </FlashcardProvider>
        </MetadataProvider> {/* <-- END WRAP */}
      </NotificationProvider>
    </UIProvider>
  </React.StrictMode>
);