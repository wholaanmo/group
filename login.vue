<template>
  <div class="login-bg">
      <div class="container">
          <div class="login-container">
              <div class="login-form">
              <form @submit.prevent="loginUser">
                  <div class="login-form-items">
                      <span class="login-label">LOG IN</span>
                      <div class="text-input-container">
                      <label class="form-label">EMAIL</label>
                      <input v-model="email" type="text" name="email" class="text-style" required>
                      
                      <label class="form-label">PASSWORD</label>
                      <div class="password-input-wrapper">
                        <input 
                          v-model="password" 
                          :type="showPassword ? 'text' : 'password'" 
                          name="password" 
                          class="text-style" 
                          required
                        >
                        <span class="password-toggle" @click="togglePasswordVisibility">
                          <i :class="showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                        </span>
                      </div>
                      </div>

                  <p v-if="message" class="error">{{ message }}</p>
                  
                      <button type="submit" class="login-btn">SIGN IN</button>
                      <router-link to="/register" class="login-btn">SIGN UP</router-link>
                      <a href="#" @click.prevent="showForgotPassword = true" class="forgot-password">
                      Forgot Password?
                      </a>
                  </div>
              </form>   
              
              <div v-if="showForgotPassword" class="forgot-password-modal">
  <div class="modal-content">
    <span class="close" @click="closeModal">&times;</span>
    <h2>Reset Password</h2>
    
    <div v-if="!otpSent && !otpVerified">
      <div class="input-group">
        <label>Email Address</label>
        <input v-model="resetEmail" type="email" placeholder="Enter your email">
      </div>
      <button @click="sendOTP" class="reset-btn">Send OTP</button>
    </div>
    
    <div v-if="otpSent && !otpVerified">
      <div class="input-group">
        <label>OTP</label>
        <input 
    v-model="otp" 
    type="text" 
    placeholder="Enter 6-digit OTP"
    maxlength="6"
    @input="otp = otp.replace(/[^0-9]/g, '')"
>
      </div>
      <button @click="verifyOTP" class="reset-btn">Verify OTP</button>
      <button @click="resendOTP" class="resend-btn">Resend OTP</button>
    </div>
    
    <div v-if="otpVerified">
      <div class="input-group">
        <label>New Password</label>
        <div class="password-input-wrapper">
        <input 
    v-model="newPassword" 
    :type="showNewPassword ? 'text' : 'password'" 
    placeholder="Enter new password" 
    @input="checkPasswordStrength"
    required
  >
  <span class="password-toggle"  @click="togglePasswordVisibility">
    <i :class="showNewPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
  </span>
  </div>
        <div class="password-strength" v-if="newPassword.length > 0">
      <div class="strength-bar" :style="{ width: (strengthScore * 20) + '%', backgroundColor: strengthColor }"></div>
      <span class="strength-text" :style="{ color: strengthColor }">
        {{ strengthMessage }}
      </span>
    </div>
    </div>
    <div class="password-input-wrapper">
      <div class="input-group">
        <label>Confirm Password</label>
        <input 
    v-model="confirmPassword" 
    :type="showConfirmPassword ? 'text' : 'password'" 
    placeholder="Confirm new password"
  >
  <span class="password-toggle1" @click="togglePasswordVisibility1">
    <i :class="showConfirmPassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
  </span>
  </div>
      </div>
      <button @click="resetPassword" class="reset-btn">Reset Password</button>
    </div>
    
    <p v-if="resetMessage" :class="{ 'success': resetSuccess, 'error': !resetSuccess }">
      {{ resetMessage }}
    </p>
  </div>
</div>
</div>
              
      <div class="login-deco-container">
      <div class="login-deco">
      <span class="penny">MONEY <br> LOG</span>
          <img src="/LOGO.png" alt="Logo Image" class="deco-image">  
      </div>
      </div>
      </div>
      </div>
  </div>
  </template>
  
  <script>
 import { ref, computed, onMounted } from 'vue'; 
  import axios from 'axios';
  import { useRouter, useRoute } from 'vue-router'; 
  
  export default {
    setup() {
      const router = useRouter();
      const route = useRoute(); 
      const email = ref('');
      const password = ref('');
      const showPassword = ref(true);
      const showNewPassword = ref(true);
      const showConfirmPassword = ref(true);
      const message = ref('');
      const showForgotPassword = ref(false);
      const resetEmail = ref('');
      const resetMessage = ref('');
      const resetSuccess = ref(false);
      const otpSent = ref(false);
      const otpVerified = ref(false);
      const otp = ref('');
      const newPassword = ref('');
      const confirmPassword = ref('');
      const resetToken = ref('');
      const redirectAfterLogin = ref('');

      const inviteToken = route.query.inviteToken;
    if (inviteToken) {
      redirectAfterLogin.value = `/api/grp_expenses/accept-invite?token=${inviteToken}`;
    }

    const acceptInvitation = async (token) => {
      try {
        const response = await axios.get(
          `/api/grp_expenses/accept-invite?token=${token}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
            }
          }
        );
        
        if (response.data.success) {
          router.push({
            name: 'Group',
            params: { groupId: response.data.groupId },
            query: { invite_accepted: 'true' }
          });
        }
      } catch (error) {
        console.error('Failed to accept invitation:', error);
        message.value = error.response?.data?.message || 'Failed to process invitation';
      } finally {
        localStorage.removeItem('invitationToken');
      }
    };

    onMounted(() => {
      const token = route.query.token;
      if (token) {
        localStorage.setItem('invitationToken', token);
      }
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && token) {
        acceptInvitation(token);
      }
    });

    const handleLoginSuccess = async (response) => {
      localStorage.setItem('jsontoken', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user.id,
        username: response.data.user.username, 
        email: response.data.user.email,
        isFirstLogin: response.data.isFirstLogin
      }));

      const inviteToken = route.query.inviteToken || localStorage.getItem('invitationToken');

  if (inviteToken) {
    try {
      const inviteResponse = await axios.get(
        `/api/grp_expenses/invite/accept?token=${inviteToken}`,
        {
          headers: {
            Authorization: `Bearer ${response.data.token}`
          }
        }
      );
      
      if (inviteResponse.data.success) {
        router.push({
          name: 'Group',
          params: { groupId: inviteResponse.data.data.groupId }
        });
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      // Fallback to regular redirect
      router.push(route.query.redirect || '/profile');
    }
  } else {
    router.push(route.query.redirect || '/profile');
  }
};
    
      const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
      showNewPassword.value = !showNewPassword.value;
    };

    const togglePasswordVisibility1 = () => {
      showConfirmPassword.value = !showConfirmPassword.value;
    };

    const strengthScore = computed(() => {
      let score = 0;
      const pass = newPassword.value;
      
      if (pass.length >= 8) score++;
      
      if (/[a-z]/.test(pass)) score++;
      
      if (/[A-Z]/.test(pass)) score++;
      
      if (/\d/.test(pass)) score++;
 
      if (/[^A-Za-z0-9]/.test(pass)) score++;
      
      return score;
    });

    // Strength classification
    const strengthClass = computed(() => {
      if (newPassword.value.length === 0) return '';
      if (strengthScore.value <= 2) return 'weak';
      if (strengthScore.value <= 3) return 'medium';
      return 'strong';
    });

     // Strength message
     const strengthMessage = computed(() => {
      if (newPassword.value.length === 0) return '';
      switch(strengthClass.value) {
        case 'weak': return 'Weak Password';
        case 'medium': return 'Medium Strength';
        case 'strong': return 'Strong Password';
        default: return '';
      }
    });

    // Strength color
    const strengthColor = computed(() => {
      switch(strengthClass.value) {
        case 'weak': return 'red';
        case 'medium': return 'orange';
        case 'strong': return 'green';
        default: return 'gray';
      }
    });

      const closeModal = () => {
        showForgotPassword.value = false;
        resetEmail.value = '';
        resetMessage.value = '';
        otpSent.value = false;
        otpVerified.value = false;
        otp.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
      };
  
      const sendOTP = async () => {
        resetMessage.value = '';
        resetSuccess.value = false;
  
        if (!resetEmail.value) {
          resetMessage.value = 'Email is required';
          return;
        }
  
        try {
            console.log('Sending OTP request for:', resetEmail.value);
          const response = await axios.post(
            'http://localhost:3000/api/users/forgot-password',
            { email: resetEmail.value }
          );
  
          console.log('OTP response:', response.data);

          if (response.data.success) {
            otpSent.value = true;
            resetSuccess.value = true;
            resetMessage.value = response.data.message || 'OTP sent to your email';
          } else {
            resetMessage.value = response.data.message || 'Failed to send OTP';
          }
    } catch (error) {
        console.error('Full OTP error:', error);
        console.error('Response data:', error.response?.data);
        resetMessage.value = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Error sending OTP. Please try again.';
    }
};
  
      const verifyOTP = async () => {
        resetMessage.value = '';
        resetSuccess.value = false;
  
        if (!otp.value) {
          resetMessage.value = 'OTP is required';
          return;
        }

        const otpString = String(otp.value).trim();

// Client-side validation
if (!/^\d{6}$/.test(otpString)) {
    resetMessage.value = 'OTP must be exactly 6 digits';
    return;
}
  
        try {
          console.log('Verifying OTP for:', resetEmail.value);
          const response = await axios.post(
            'http://localhost:3000/api/users/verify-otp',
            { 
              email: resetEmail.value,
              otp: otpString
            }
          );

          console.log('OTP verification response:', response.data);
  
          if (response.data.success) {
            otpVerified.value = true;
            resetToken.value = response.data.token;
            resetSuccess.value = true;
            resetMessage.value = response.data.message || 'OTP verified. Please set a new password.';
          } else {
            resetMessage.value = response.data.message || 'Invalid OTP';
          }
        } catch (error) {
        console.error('Full OTP verification error:', error);
        console.error('Error response:', error.response?.data);
        
        // Show specific error message if available
        if (error.response?.data?.message === "OTP must be exactly 6 digits") {
            resetMessage.value = 'Please enter exactly 6 digits for OTP';
        } else {
            resetMessage.value = error.response?.data?.message || 
                               error.response?.data?.error || 
                               'Error verifying OTP. Please try again.';
        }
    }
};
  
      const resendOTP = async () => {
        await sendOTP();
        resetMessage.value = 'New OTP sent to your email';
      };
  
      const resetPassword = async () => {
        resetMessage.value = '';
        resetSuccess.value = false;
  
        if (newPassword.value !== confirmPassword.value) {
          resetMessage.value = 'Passwords do not match';
          return;
        }
  
      if (newPassword.value.length < 8) {
        resetMessage.value = 'Password must be at least 8 characters';
        return;
      }
  
      if (strengthScore.value < 4) {
        resetMessage.value = 'Password must be strong! Include uppercase, lowercase, numbers, and special characters.';
        return;
      }

        try {
        console.log('Attempting password reset with:', {
            email: resetEmail.value,
            token: resetToken.value
        });

          const response = await axios.post(
            'http://localhost:3000/api/users/reset-password-otp',
            { 
              email: resetEmail.value,
              newPassword: newPassword.value,
              token: resetToken.value
            }
          );
  
          
        console.log('Password reset response:', response.data);

          if (response.data.success) {
            resetSuccess.value = true;
            resetMessage.value = 'Password reset successfully. You can now login with your new password.';
            setTimeout(() => {
              closeModal();
            }, 3000);
          } else {
            resetMessage.value = response.data.message || 'Failed to reset password';
          }
         } catch (error) {
        console.error('Full password reset error:', error);
        console.error('Error response:', error.response?.data);
        
        resetMessage.value = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Error resetting password. Please try again.';
    }
};
  
      const loginUser = async () => {
        message.value = ''; // Reset error message
  
        if (!email.value || !password.value) {
          message.value = 'Email and password are required!';
          return;
        };
  
        try {
          const response = await axios.post(
            'http://localhost:3000/api/users/login',
            {
              email: email.value,
              password: password.value,
            },
          );
  
          if (response.data.success === 1) {
            localStorage.setItem('jsontoken', response.data.token);
            localStorage.setItem('user', JSON.stringify({
              id: response.data.user.id,
              username: response.data.user.username, 
              email: response.data.user.email,
              isFirstLogin: response.data.isFirstLogin
            }));
            router.push('/profile');
          } else {
            message.value = response.data.message || 'Login failed.';
          }
        } catch (error) {
          console.error('Login error:', error);
          if (error.response && error.response.status === 401) {
            message.value = 'Invalid email or password.';
          } else {
            message.value = 'Login service unavailable. Please try again later.';
          }
        }
      };
  
      return {
        email,
        password,
        message,
        showPassword,
        showNewPassword,
        showConfirmPassword,
        togglePasswordVisibility, 
        togglePasswordVisibility1, 
        loginUser,
        showForgotPassword,
        resetEmail,
        resetMessage,
        resetSuccess,
        otpSent,
        otpVerified,
        otp,
        newPassword,
        confirmPassword,
        closeModal,
        sendOTP,
        verifyOTP,
        resendOTP,
        resetPassword,
        strengthScore,
      strengthClass,
      strengthMessage,
      strengthColor,
      handleLoginSuccess ,
      redirectAfterLogin 
      };
    },
  };
  </script>
  
  
  <style scoped>
 .password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 40%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #72aa95;
  font-size: 16px;
}

.password-toggle1 {
  position: absolute;
  right: 10px;
  top: 70%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #72aa95;
  font-size: 16px;
}

.password-toggle:hover {
  color: #548271;
}

/* Make sure your password input has padding on the right to accommodate the icon */
.text-style[type="password"],
.text-style[type="text"] {
  padding-right: 35px;
  width: 100%;
}
  .forgot-password {
display: block;
margin-top: 15px;
text-align: center;
color: #666;
text-decoration: none;
font-size: 0.9em;
}

.forgot-password:hover {
color: #333;
text-decoration: underline;
}

.forgot-password-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 26px;
  font-weight: bold;
  color: #7aa093; /* softened tone for default */
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  background: none;
  border: none;
  outline: none;
}

.close:hover {
  color: #548271;
  transform: scale(1.2); /* subtle zoom effect */
}



h2 {
  color: #4f7a6b;
  margin-bottom: 25px;
  text-align: center;
  font-weight: 700;
  font-size: 1.75rem;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, #8fc4b4, #72aa95);
  background-clip: text;
  color: transparent;
  transition: transform 0.3s ease;
}


.input-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  color: #4f7a6b;
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.3s;
}

.input-group input {
  width: 100%;
  box-sizing: border-box; /* Ensures padding & border stay inside the container */
  padding: 12px 16px;
  border: 1px solid #cfeae2;
  border-radius: 10px;
  font-size: 15.5px;
  background-color: #f7fbfa;
  transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s;
}

.input-group input::placeholder {
  color: #a3b9b2;
}


.input-group input:focus {
  border-color: #72aa95;
  outline: none;
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(143, 196, 180, 0.25);
}

.input-group input:focus + label,
.input-group input:focus-visible + label {
  color: #548271;
}


.reset-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #8fc4b4, #72aa95, #548271);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.4s ease, transform 0.2s ease, box-shadow 0.3s ease;
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(84, 130, 113, 0.25);
}

.reset-btn:hover {
  background: linear-gradient(135deg, #a8d8cb, #7fb9a2, #4f7a6b);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(84, 130, 113, 0.35);
}

.reset-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(84, 130, 113, 0.3);
}




.resend-btn {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #8fc4b4, #72aa95, #548271);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.4s ease, transform 0.2s ease, box-shadow 0.3s ease;
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(84, 130, 113, 0.25);
}

.resend-btn:hover {
  background: linear-gradient(135deg, #a8d8cb, #7fb9a2, #4f7a6b);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(84, 130, 113, 0.35);
}

.resend-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(84, 130, 113, 0.3);
}
@media (max-width: 480px) {
  .modal-content {
    width: 90%;
    padding: 20px;
  }
}

.success {
    color: #00C851;
    background-color: #e8f5e9;
    border: 1px solid #00C851;
}

.error {
  color: #ff4444;
  background-color: #ffebee;
  border: 1px solid #ff4444;
  padding: 5px;
}


@keyframes flash {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

.error {
    animation: flash 1.5s infinite;
}
 
  .login-bg {
      background-image: url("/circle.png");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      min-height: 100vh;
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-x: hidden;
  }
  
  .container {
      width: 100%;
      min-height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  
  .login-container {
      width: 100%;
      max-width: 650px;
      min-width: 390px;
      height: auto;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      flex-direction: row;
      padding: 30px;
      gap: 20px;
      box-sizing: border-box;
  }
  
  .login-form {
      width: 50%;
      display: flex;
      flex-direction: column;
      text-align: center;
      align-items: center;
      padding: 10px;
  }
  
  .login-form-items {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 99%;
  }
  
  span.login-label {
      color: black;
      font-weight: 900;
      font-size: 36px;
      letter-spacing: 2px;
      margin-bottom: 30px;
      white-space: nowrap;
  }
  
  .text-input-container {
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
  }
  
  .text-input-container input {
      width: 100%;
      padding: 4px;
      font-size: 14px;
      margin-bottom: 10px;
  }
  
  input.text-style {
      border-radius: 10px;
      width: 100%;
      height: 10px;
      padding: 10px 12px;
      font-size: 14px;
      background: none;
      border: 2px solid rgb(51, 47, 47);
      color: black;
      box-sizing: border-box;
  }
  
  input:focus {
      outline: none;
  }
  
  .form-label {
      color: black;
      font-weight: 350;
      font-size: 15px;
      margin-bottom: 5px;
  }
  
  .login-btn {
      width: 200px;
      background: #D6EFD8;
      border-radius: 20px;
      border: none;
      padding: 10px 0;
      color: black;
      font-weight: 705;
      font-size: 15px;
      letter-spacing: 2px;
      margin-bottom: 10px;
      margin-top: 10px;
      cursor: pointer;
      box-shadow: 0 8px 10px 0 rgba(0,0,0,0.25);
      text-decoration: none;
      text-align: center;
  }
  
  .login-btn:hover {
      background-color: #80AF81;
  }
  
  .login-deco-container {
      width: 50%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;
  }
  
  .login-deco {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  
  .deco-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      margin-top: 100px;
  }
  
  .penny {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      color: #f6f8d5;
      font-weight: bold;
      font-size: 40px;
      letter-spacing: 2px;
      padding-top: 10px;
      text-align: center;
  }
  
  .success {
      color: green;
  }
  
  .invalid {
      color: red;
      font-size: 0.9em;
  }
  
  /* Responsive adjustments without stacking */
  
  @media (max-width: 1024px) {
      .login-container {
          padding: 20px;
          gap: 10px;
      }
  
      .login-form,
      .login-deco-container {
          width: 50%;
      }
  
      .deco-image {
          max-width: 260px;
          margin-top: 80px;
      }
  
      .penny {
          font-size: 36px;
      }
  
      .login-label {
          font-size: 28px;
      }
  }
  
  @media (max-width: 768px) {
      .login-container {
          padding: 20px;
          gap: 10px;
      }

      .text-input-container {
              width: 100%;
          }
  
      .login-form,
      .login-deco-container {
          width: 50%;
      }
  
      .deco-image {
          max-width: 220px;
      }
  
      .penny {
          font-size: 32px;
      }
  
      .login-label {
          font-size: 24px;
      }
  
      .login-btn {
          font-size: 14px;
          padding: 8px 0;
      }
  }
  
  @media (max-width: 480px) {
      .login-container {
          padding: 20px;
          gap: 10px;
      }
  
      .login-form,
      .login-deco-container {
          width: 50%;
      }
  
      .deco-image {
          max-width: 220px;
      }
  
      .penny {
          font-size: 28px;
      }
  
      .login-label {
          font-size: 20px;
      }
  
      .login-btn {
          font-size: 13px;
          padding: 6px 0;
      }
  }
  </style>
