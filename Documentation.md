## Installations & Setup
1. npm create vite@latest
2. Framework: React
3. Variant: Javascript
4. npm install
5. npm install firebase
6. cd go-fish
7. npm install lucide
8. npm install react-router-dom

## Adding the Jest Testing Framework
1. npm install jest @testing-library/react @testing-library/jest-dom
2. npm install ts-mock-firebase 

## If 'go-fish' file already exists
1. cd go-fish
2. npm install --legacy-peer-deps
3. npm install firebase --legacy-peer-deps
4. npm install lucide --legacy-peer-deps
5. npm install react-router-dom --legacy-peer-deps
7. npm run dev

## Jest + React Testing Library for Testcases
1.  cd go-fish
2.  npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
3.  npm install --save-dev @vitejs/plugin-react@latest @babel/preset-react @babel/preset-env 
4.  npm install --save-dev identity-obj-proxy
5.  npm install --save-dev vitest
6.  RUNNING TESTS: npm test
7.  RUNNING TEST COVERAGES: npm run test:coverage
