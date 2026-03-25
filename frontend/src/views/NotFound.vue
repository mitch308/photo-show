<script setup lang="ts">
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面不存在</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.not-found h1 {
  font-size: 80px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 20px;
}

.not-found p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.not-found a {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border-radius: 4px;
}
</style>