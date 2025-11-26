<script setup lang="ts">
import SpanCopyable from '@/components/SpanCopyable.vue';
import { useCopy } from '@/composable/copy';
import { fetchExpandedUrl, type UrlExpansionResult } from './url-unshortener.service';

const shortUrl = ref('https://bit.ly/xyz');
const loading = ref(false);
const errorMessage = ref('');
const result = ref<UrlExpansionResult | null>(null);
const history = ref<UrlExpansionResult[]>([]);

const hasResult = computed(() => result.value !== null);
const hasHistory = computed(() => history.value.length > 0);

const { copy } = useCopy({ source: () => result.value?.fullLink ?? '', text: 'Full URL copied to the clipboard' });

function updateHistory(entry: UrlExpansionResult) {
  const existingWithoutEntry = history.value.filter(item => item.originalUrl !== entry.originalUrl);
  history.value = [entry, ...existingWithoutEntry].slice(0, 5);
}

async function handleExtract() {
  const trimmedUrl = shortUrl.value.trim();
  if (!trimmedUrl) {
    errorMessage.value = 'Please enter a short URL to expand.';
    result.value = null;
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const expanded = await fetchExpandedUrl(trimmedUrl);
    result.value = expanded;
    updateHistory(expanded);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to expand the URL.';
    errorMessage.value = message;
    result.value = null;
  }
  finally {
    loading.value = false;
  }
}

function applyHistory(entry: UrlExpansionResult) {
  shortUrl.value = entry.originalUrl;
  result.value = entry;
}
</script>

<template>
  <div class="url-unshortener" flex flex-col gap-4>
    <c-card>
      <div flex items-center gap-3 flex-col md:flex-row>
        <c-input-text
          v-model:value="shortUrl"
          label="Short URL"
          size="large"
          placeholder="Paste the short URL you want to expand"
          clearable
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          spellcheck="false"
          w-full
          @keydown.enter.prevent="handleExtract"
        />

        <c-button
          type="primary"
          size="large"
          :disabled="loading"
          w-full md:w-auto
          @click="handleExtract"
        >
          Expand URL
        </c-button>
      </div>

      <div mt-2 text-sm op-60>
        The request is sent to the <code>/extract</code> endpoint and expects the Flask backend to be available.
      </div>

      <div v-if="loading" mt-3 flex items-center gap-2>
        <n-spin size="small" />
        <span>Resolving redirects…</span>
      </div>

      <c-alert v-if="errorMessage" mt-3 type="error">
        {{ errorMessage }}
      </c-alert>
    </c-card>

    <c-card v-if="hasResult">
      <div flex items-center justify-between gap-3 mb-3>
        <div>
          <div text-sm op-60>
            Original URL
          </div>
          <c-text-copyable :value="result?.originalUrl" />
        </div>

        <c-button variant="text" type="primary" :disabled="!result" @click="copy">
          Copy full URL
        </c-button>
      </div>

      <n-divider />

      <div mb-3>
        <div text-sm op-60>
          Final destination
        </div>
        <c-text-copyable :value="result?.fullLink" />
      </div>

      <div>
        <div text-sm op-60 mb-1>
          Redirect chain
        </div>
        <c-card v-if="result?.redirections.length" class="redirect-card">
          <ol class="redirect-list">
            <li v-for="(link, index) in result?.redirections" :key="index">
              <SpanCopyable :value="link" />
            </li>
          </ol>
        </c-card>
        <div v-else op-60>
          No redirections were reported.
        </div>
      </div>
    </c-card>

    <c-card v-if="hasHistory">
      <div font-bold mb-2>
        Recent lookups
      </div>
      <n-divider />
      <div class="history-grid">
        <div v-for="item in history" :key="item.fetchedAt" class="history-entry">
          <div text-sm op-60>
            {{ new Date(item.fetchedAt).toLocaleString() }}
          </div>
          <div font-mono text-sm line-clamp-1>
            {{ item.originalUrl }}
          </div>
          <c-button variant="text" type="primary" @click="applyHistory(item)">
            Load result
          </c-button>
        </div>
      </div>
    </c-card>
  </div>
</template>

<style scoped>
.url-unshortener {
  max-width: 960px;
}

.redirect-list {
  display: grid;
  gap: 10px;
  padding-left: 16px;
  margin: 0;
}

.redirect-card {
  padding: 14px 16px;
}

.history-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.history-entry {
  display: grid;
  gap: 6px;
  align-items: flex-start;
}
</style>
