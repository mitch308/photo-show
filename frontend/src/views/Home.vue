<script setup lang="ts">
</script>

<template>
  <div class="home-page">
    <header class="header">
      <h1>摄影工作室</h1>
      <nav>
        <router-link to="/login">管理登录</router-link>
      </nav>
    </header>
    <main class="main">
      <div class="welcome">
        <h2>作品展示平台</h2>
        <p>专业的摄影作品展示与管理平台</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: var(--bg-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.header nav a {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: 4px;
  transition: opacity 0.2s;
}

.header nav a:hover {
  opacity: 0.9;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome {
  text-align: center;
}

.welcome h2 {
  font-size: 48px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.welcome p {
  font-size: 18px;
  color: var(--text-secondary);
}
</style>