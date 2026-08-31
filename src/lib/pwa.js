// Desregista o service worker e limpa as caches do browser, para forçar a
// app a ir buscar sempre a última versão publicada em vez de ficar presa
// numa versão antiga em cache (útil sobretudo na PWA instalada no telemóvel).
export async function forcarAtualizacao() {
  if ('serviceWorker' in navigator) {
    const registos = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registos.map((registo) => registo.unregister()))
  }

  if ('caches' in window) {
    const nomes = await caches.keys()
    await Promise.all(nomes.map((nome) => caches.delete(nome)))
  }

  window.location.reload()
}
