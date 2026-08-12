
$(function(){


	/*  Gallery lightBox
 	================================================*/

 	if( $(".lightbox").length > 0 ) {

		$(".lightbox").prettyPhoto();

	}

});


/*  Carrossel: pré-carrega os slides seguintes
	================================================
	As imagens dos slides 2 e 3 nascem com loading="lazy" para não disputar
	banda com a primeira pintura. Sozinho, porém, o lazy só dispara o download
	quando o slide aparece — em conexão lenta o slide entra em branco. Assim
	que a página termina de carregar, promovemos essas imagens a eager: elas
	são buscadas em segundo plano, com folga antes da primeira troca (7,5s).
	================================================*/

$(window).on('load', function() {

	$('.carousel-home .item img[loading="lazy"]').each(function() {

		this.loading = 'eager';

	});

});
