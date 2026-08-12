require "html-proofer"

task default: "test"

task :test do
  sh "bundle exec jekyll build"
  options = {
    assume_extension: ".html",
    allow_hash_href: true,
    # Hints de conexao (rel="preconnect"/"dns-prefetch") apontam para a origem
    # nua, que nao serve nenhum recurso e responde 404. Sao dicas de rede, nao
    # links navegaveis. A folha de estilo em si continua sendo verificada.
    ignore_urls: [
      %r{\Ahttps://fonts\.googleapis\.com/?\z},
      %r{\Ahttps://fonts\.gstatic\.com/?\z},
      # A pagina de erro responde 404 por definicao; o canonical que o
      # jekyll-seo-tag gera para ela aponta para essa mesma URL.
      %r{/404\.html\z}
    ]
  }
  HTMLProofer.check_directory("./_site", options).run
end
