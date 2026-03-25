<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const loginForm = ref({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      const res = await login(loginForm.value.username, loginForm.value.password);
      authStore.setUser(res.user);
      ElMessage.success('登录成功');
      
      // 跳转到原本要访问的页面或后台首页
      const redirect = (route.query.redirect as string) || '/admin';
      router.push(redirect);
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败');
    } finally {
      loading.value = false;
    }
  });
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">管理登录</h1>
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  max-width: 90%;
  padding: 40px;
  background: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
}
</style>