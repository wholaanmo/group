<template>
  <div class="bg">
  <div class="container">
    <div class="hero-graphic">
      <img src="/LOGO.png" alt="Money Log Logo" class="logo" />
      <div class="graphic-accent"></div>
    </div>

    <div class="content">
      <h2>💰
    Track with ease,<br />
    <span class="highlight">spend with peace!</span></h2>
      <p class="description">
        Money Log is a budget tracker website focused on helping users manage and track their expenses. 
        This program allows users to record their expenses, categorize transactions, and follow their 
        financial budget over time.
      </p>
      </div>
  </div>

  <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon"><i class="fas fa-clipboard-list icon clipboard-icon"></i></div>
          <h3>Personal Expense Management</h3>
          <p>Log daily spending to monitor your expenses monthly and yearly</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon1">👥</div>
          <h3>Group Expense Management</h3>
          <p>Split costs and track shared expenses with housemates or friends</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon2"><i class="fas fa-chart-pie icon chart-icon"></i></div>
          <h3>Data Visualization</h3>
          <p>Visualize your spending trends with interactive tables and pie charts. </p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon3"><i class="fas fa-tags icon tags-icon"></i></div>
          <h3>Expense Categorization</h3>
          <p>Categorize each transaction (e.g., food, bills, transportation) to help you better organize and analyze your spending. </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon4"><i class="fas fa-calendar-alt  icon calendar-icon"></i></div>
          <h3>Filter Expenses by Date</h3>
          <p>Sort and filter expenses by month and year to easily track your financial progress over time. </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon5"><i class="fas fa-chart-line icon line-icon"></i></div>
          <h3>Budget Tracking</h3>
          <p>Add your personal budget and track how much you’ve spent and how much is left as you add expenses.</p>
        </div>
      </div>

    <div class="register-container">
        <div class="register-card">
          <h3>Ready to take control of your finances?</h3>
          <p>Join thousands of users who are managing their money smarter</p>
          <router-link to="/register" class="register-button">
            Get Started - It's Free
          </router-link>
          <div class="login-prompt">
            Already have an account? <router-link to="/login">Log in</router-link>
          </div>
          </div>
          </div>
  </div>

</template>



<script scoped>
import Navigation from "./navigation.vue";
 
export default {
  components: { Navigation },
  data() {
    return {
      // 👇 Add for protected data
      userInfo: null,
      error: null
    };
  },
  mounted() {
    // 🔐 Call protected API
    fetch('http://localhost:3000/api/users/', { // Changed port from 8000 to 3000
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('jsontoken'), // Changed from authToken
      'Accept': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(data => {
      this.userInfo = data;
    })
    .catch(err => {
      console.error("API Error:", err);
      this.error = "Failed to load user data";
    });
},
};
</script>


<style>
body {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: #fcffed;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>

<style scoped>
.register-container {
  max-width: 600px;
  margin: 30px auto 60px;
  padding: 0 20px;
}

.register-card {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 24px;
  padding: 15px 35px;
  box-shadow: 0 15px 35px rgba(60, 120, 80, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.register-card::before {
  content: '';
  position: absolute;
  top: -50px;
  left: -50px;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at top left, #c8e6c9 0%, transparent 70%);
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.register-card:hover {
  box-shadow: 0 20px 45px rgba(50, 120, 70, 0.25);
  transform: translateY(-5px) scale(1.01);
}

.register-card h2 {
  font-size: 2rem;
  margin-bottom: 16px;
  color: #2e7d32;
  font-weight: 800;
  position: relative;
  z-index: 1;
}

.register-card p {
  font-size: 1.05rem;
  color: #556b60;
  margin-bottom: 30px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

.register-button {
  display: inline-block;
  background: linear-gradient(135deg, #2e7d32, #a5d6a7); /* Rich green to soft green */
  color: white;
  padding: 14px 40px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
  transition: all 0.4s ease;
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.25);
  background-size: 200% 200%;
  background-position: left center;
  position: relative;
  overflow: hidden;
}

.register-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transform: skewX(-20deg);
  transition: all 0.6s ease;
}

.register-button:hover {
  transform: translateY(-4px);
  background-position: right center;
  box-shadow: 0 10px 28px rgba(46, 125, 50, 0.35);
}

.register-button:hover::before {
  left: 120%;
}


.login-prompt {
  font-size: 0.95em;
  color: #546e60;
  margin-top: 20px;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .feature-card {
    min-height: auto;
    padding: 18px;
  }
  
  .register-card {
    padding: 25px 20px;
  }
}
.bg {
  background: linear-gradient(135deg, #e0f7fa, #fce4ec); /* soft teal to soft pink */
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;
  overflow-x: hidden;
  overflow-y: hidden;
}

.bg::before,
.bg::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  opacity: 0.2;
  z-index: 0;
}

.bg::before {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle at center, #81c784, #4caf50);
  top: -100px;
  left: -100px;
}

.bg::after {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle at center, #ffd54f, #ffb74d);
  bottom: -150px;
  right: -150px;
}

.container,
.features-grid,
.register-container {
  position: relative;
  z-index: 1; /* Makes sure content stays above background shapes */
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px; /* Tighter gap */
  margin: 40px auto;
  max-width: 1000px; /* More compact container */
  padding: 0 20px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 25px; /* Reduced padding */
  transition: all 0.3s ease;
  border: 1px solid rgba(70, 180, 120, 0.1);
  box-shadow: 0 4px 12px rgba(50, 120, 70, 0.08);
  min-height: 220px; /* Smaller fixed height */
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(50, 120, 70, 0.12);
}

.feature-icon {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #e8f5e9, #a5d6a7);
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.feature-icon1 {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #a8edea, #fed6e3); /* mint to soft pink */
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
}

.feature-icon1:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.feature-icon2 {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #ffe29f, #ffa99f); /* pastel yellow to peach */
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
}

.feature-icon2:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
.feature-icon3 {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #d4fc79, #96e6a1); /* light green to mint */
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
}

.feature-icon3:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.feature-icon4 {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #fff1a6, #fcd374); /* mint to soft blue */
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
}

.feature-icon4:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
.feature-icon5 {
  font-size: 2rem; /* Smaller icon */
  margin-bottom: 15px;
  background: linear-gradient(135deg, #dec8f3, #7b60bb);
  width: 60px; /* Smaller circle */
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(70, 180, 120, 0.2);
  align-self: center;
}

.feature-icon5:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.feature-card h3 {
  font-size: 1.2rem; /* Smaller heading */
  color: #2a4b3c;
  margin-bottom: 12px;
  font-weight: 600;
  text-align: center;
}

.feature-card p {
  font-size: 0.95rem; /* Smaller text */
  color: #5a6e65;
  line-height: 1.5;
  margin: 0;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on smaller desktop */
  }
}

@media (max-width: 600px) {
  .features-grid {
    grid-template-columns: 1fr; /* 1 column on mobile */
    gap: 15px;
  }
  
  .feature-card {
    min-height: auto;
    padding: 20px;
  }
}


.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(60, 120, 80, 0.15);
}

.hero-graphic {
  flex: 1;
  text-align: center;
}

.logo {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(50, 120, 70, 0.15));
  transition: transform 0.3s ease;
  z-index: 2;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.logo:hover {
  transform: translateY(-5px);
}

.graphic-accent {
  position: absolute;
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(100, 200, 150, 0.1) 0%, rgba(255,255,255,0) 70%);
  top: -10%;
  left: -10%;
  z-index: 1;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: float 8s ease-in-out infinite;
}

.content {
  width: 50%;
  padding: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 255, 240, 0.85));
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(50, 120, 70, 0.12);
  backdrop-filter: blur(12px);
  transition: all 0.4s ease;
  position: relative;
}

.content:hover {
  transform: translateY(-6px);
  box-shadow: 0 25px 40px rgba(50, 120, 70, 0.2);
}


h2 {
  font-size: 2.6rem;
  font-weight: 700;
  color: #1b5e20;
  margin-bottom: 1.5rem;
  line-height: 1.3;
  position: relative;
  letter-spacing: -0.5px;
  padding-left: 16px;
  border-left: 6px solid #81c784;
  animation: fadeSlideIn 0.6s ease;
  text-shadow: 0 1px 0 #ffffff, 0 2px 4px rgba(0,0,0,0.06);
}


.highlight {
  color: #2e7d32;
  position: relative;
  padding: 2px 8px;
  border-radius: 8px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  font-weight: 700;
  transition: all 0.4s ease;
}

.highlight::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 2px;
  width: 100%;
  height: 5px;
  z-index: -1;
  border-radius: 4px;
  opacity: 0.4;
}

.highlight:hover {
  background: linear-gradient(90deg, rgba(76,175,80,0.2), rgba(165,214,167,0.3));
  box-shadow: 0 0 6px rgba(76,175,80,0.3);
}

.description {
  font-size: 1.2rem;
  line-height: 1.8;
  color: #3e564d;
  margin-bottom: 2rem;
  max-width: 90%;
  background-color: rgba(255, 255, 255, 0.45);
  border-left: 4px solid #c8e6c9;
  border-radius: 12px;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.35s ease;
}

.description::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(165, 214, 167, 0.2), transparent);
  z-index: 0;
  transition: all 0.5s ease;
}

.description:hover::before {
  left: 0;
}

.description:hover {
  background-color: rgba(245, 255, 245, 0.75);
  box-shadow: 0 4px 15px rgba(76,175,80,0.1);
}

/* Subtle floating icon effect */
@keyframes floatIcon {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}



/* RESPONSIVE DESIGN */
@media only screen and (max-width: 1024px) {
  .container {
    flex-direction: column;
    padding: 40px 5%;
  }
  
  .hero-graphic, .content {
    width: 100%;
    max-width: 600px;
  }
  
  .hero-graphic {
    margin-bottom: 40px;
  }
  
  h2 {
    font-size: 2.2rem;
    text-align: center;
  }
  
  .highlight::after {
    bottom: 2px;
    height: 6px;
  }
}

@media only screen and (max-width: 768px) {
  h2 {
    font-size: 1.8rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .content {
    padding: 30px;
  }
}

@media only screen and (max-width: 480px) {
  h2 {
    font-size: 1.6rem;
  }
  
  .feature-pill {
    display: block;
    margin-right: 0;
    text-align: center;
  }
  
  .graphic-accent {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
}
</style>
