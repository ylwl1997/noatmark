<?php
/**
 * Plugin Name: NoAtMark Text Hygiene
 * Description: Strip invisible characters (zero-width, BOM, etc.) from your content automatically on save, or bulk-clean all posts. Companion to noatmark.com.
 * Version: 0.1.0
 * Author: NoAtMark
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Build the invisible-character regex from code points (avoids literal invisible chars). */
function noatmark_invisible_regex() {
	$pts = array( 0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0x00AD, 0x200E, 0x200F, 0x034F, 0x00A0 );
	$ranges = array( array(0xFE00, 0xFE0F), array(0xE0100, 0xE01EF), array(0x2000, 0x200A) );
	$class = '';
	foreach ( $pts as $cp ) { $class .= '\\x{' . dechex( $cp ) . '}'; }
	foreach ( $ranges as $r ) { $class .= '\\x{' . dechex( $r[0] ) . '}-\\x{' . dechex( $r[1] ) . '}'; }
	return '/[' . $class . ']/u';
}

function noatmark_strip_invisible( $text ) {
	if ( ! is_string( $text ) || '' === $text ) { return $text; }
	return preg_replace( noatmark_invisible_regex(), '', $text );
}

/** Auto-strip invisible characters whenever content is saved. */
function noatmark_content_save_pre( $content ) {
	return noatmark_strip_invisible( $content );
}
add_filter( 'content_save_pre', 'noatmark_content_save_pre' );
add_filter( 'excerpt_save_pre', 'noatmark_strip_invisible' );
add_filter( 'title_save_pre', 'noatmark_strip_invisible' );

/** Gutenberg editor sidebar: live invisible-char count + one-click clean. */
function noatmark_enqueue_block_editor() {
	wp_enqueue_script(
		'noatmark-block-editor',
		plugin_dir_url( __FILE__ ) . 'assets/block-editor.js',
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-data', 'wp-compose', 'wp-components' ),
		'0.1.0',
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'noatmark_enqueue_block_editor' );

/** Admin page: bulk scan & clean all posts. */
function noatmark_add_admin_menu() {
	add_management_page( 'NoAtMark Text Hygiene', 'NoAtMark Text Hygiene', 'manage_options', 'noatmark-hygiene', 'noatmark_admin_page' );
}
add_action( 'admin_menu', 'noatmark_add_admin_menu' );

function noatmark_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No permission.' ); }

	$cleaned = 0;
	$scanned = 0;

	if ( isset( $_POST['noatmark_clean'] ) && check_admin_referer( 'noatmark_clean' ) ) {
		$posts = get_posts( array(
			'post_type'      => 'any',
			'post_status'    => array( 'publish', 'draft', 'pending' ),
			'posts_per_page' => -1,
			'fields'         => 'ids',
		) );
		foreach ( $posts as $post_id ) {
			$content = get_post_field( 'post_content', $post_id );
			$clean   = noatmark_strip_invisible( $content );
			$scanned++;
			if ( $clean !== $content ) {
				wp_update_post( array( 'ID' => $post_id, 'post_content' => $clean ), true );
				$cleaned++;
			}
		}
	}
	?>
	<div class="wrap">
		<h1>NoAtMark Text Hygiene</h1>
		<p>Strips invisible characters (zero-width spaces, joiners, BOMs, soft hyphens) from your content. Auto-clean is on for every save.</p>
		<?php if ( $scanned ) : ?>
			<div class="notice notice-success"><p>Scanned <?php echo (int) $scanned; ?> posts &mdash; cleaned invisible characters in <?php echo (int) $cleaned; ?>.</p></div>
		<?php endif; ?>
		<form method="post">
			<?php wp_nonce_field( 'noatmark_clean' ); ?>
			<p><button class="button button-primary" name="noatmark_clean" value="1">Scan &amp; clean all posts</button></p>
		</form>
		<p><a href="https://noatmark.com/" target="_blank" rel="noopener">More text-hygiene tools &rarr;</a></p>
	</div>
	<?php
}
