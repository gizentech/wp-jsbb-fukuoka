<?php
/**
 * The base configuration for WordPress
 */

// ** Database settings ** //
define( 'DB_NAME', 'jsbbfukuoka_wp9' );
define( 'DB_USER', 'jsbbfukuoka_wp9' );
define( 'DB_PASSWORD', '?u@j=:n:izcK' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 */
define( 'AUTH_KEY',         'io}Mbj6HaN-#30hxlx>Y[UwhG<~x]_Q7WqB6]%)%+&Rx9mN$uD>fw}tC;8~o0w2z' );
define( 'SECURE_AUTH_KEY',  'nJas-dSlQ6+b9%nKSQ&=%enZcYm4&iXVNHP/b qW#3>OH^bsYqF534ecnYjk?mP<' );
define( 'LOGGED_IN_KEY',    ' aR>2*f]w7#>FdG-`w5=,]]OxN3j#|qK~aH~%UZ-ukz{6!IN**[h<)p3*cusciH/' );
define( 'NONCE_KEY',        'Z_!e3Lic^g;j!lg&),vwW~&|zT5~4|V|NDKQw6j)cAL`W:H/vlPn>CkbkWxnK&Q:' );
define( 'AUTH_SALT',        'AGl@*ZOmuaTm),P%^9/Ed:x7_.[s9XdR1eOU,fQ{drGqZz|%Ux-2g~h[-O=#yd{)' );
define( 'SECURE_AUTH_SALT', 'Rni:oU<^ru3O;b8^_R*<Vn;?M`aiD!l,FFOr|qH+TcC{J&WWcO6u@@0>=()`??eV' );
define( 'LOGGED_IN_SALT',   ':spcc8,B{?h9jjM+/$UUZuf2X9&SirPOz%vimd5OWDjv%.U];tT&V;8zsn6B0G&]' );
define( 'NONCE_SALT',       'Pb9P7wmY{5$vTkgha7kWW)4xs2i2N`MVf^0$HqGt|v2`>&auwd[{dc{vYD88V3AG' );

$table_prefix = 'wp_';
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */

// 🚀 サブドメイン用のURL固定（今はHTTP）
define( 'WP_HOME', 'https://wp.jsbb-fukuoka.com' );
define( 'WP_SITEURL', 'https://wp.jsbb-fukuoka.com' );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php'; // 👈 ここが消えているとFatal Errorになります