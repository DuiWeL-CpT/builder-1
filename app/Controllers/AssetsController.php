<?php

namespace App\Controllers;

use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Http\Request;

class AssetsController {

	/**
	 * @var \Laravel\Lumen\Application
	 */
	protected $app;

	protected $event;
	protected $request;

	public function __construct( Dispatcher $event, Request $request ) {
		$this->event = $event;
		$this->request = $request;
		$this->app = app();

		$this->event->listen( 'driver:before_delete_post', [
			$this,
			'deletePostAssetsHook',
		] );

		// Save compiled less into one css bundle
		$this->event->listen( 'driver:ajax:save_css_bundle', [
			$this,
			'saveCssBundleHook',
		] );

		$this->event->listen( 'vc:post_ajax:set_post_data', [
			$this,
			'setPostDataHook',
		] );
	}

	public function setPostDataHook( $postId, $content, $data ) {
		$this->updatePostAssets( $postId, 'scripts', $this->request->has( 'scripts' ) ? $this->request->input( 'scripts' ) : [ ] );
		$this->updatePostAssets( $postId, 'styles', $this->request->has( 'styles' ) ? $this->request->input( 'styles' ) : [ ] );
		$this->generateScriptsBundle();
		$styleBundles = $this->getStyleBundles();

		$this->event->fire( 'vc:assets:set_post_data_hook:response', [ $styleBundles ] );
	}

	/**
	 * Called every time post is permanently deleted
	 *
	 * Remove list of associated assets
	 *
	 * @param int $postId Post ID
	 */
	public function deletePostAssetsHook( $postId ) {
		foreach ( [ 'scripts', 'styles' ] as $assetType ) {
			$optionName = 'vc_v_' . $assetType;
			$assets = last( $this->event->fire( 'driver:option:get', [
				$optionName,
				[ ],
			] ) );

			if ( ! is_array( $assets ) || ! isset( $assets[ $postId ] ) ) {
				continue;
			}

			unset( $assets[ $postId ] );

			$this->event->fire( 'driver:option:set', [
				$optionName,
				$assets,
			] );
		}
	}

	/**
	 * Save compiled less into one css bundle
	 *
	 * @param \Illuminate\Http\Request $request
	 */
	public function saveCssBundleHook( Request $request ) {
		$contents = $request->input( 'contents' );

		$bundleUrl = $this->generateStylesBundle( $contents );

		$this->event->fire( 'vc:assets:save_css_bundle_hook:response', [
			$bundleUrl,
		] );
	}

	/**
	 * Generate (save to fs and update db) scripts bundle
	 *
	 * Old files are deleted
	 *
	 * @return bool|string URL to generated bundle
	 */
	private function generateScriptsBundle() {
		$assets = last( $this->event->fire( 'driver:option:get', [
			'vc_v_scripts',
			[ ],
		] ) );

		$files = [ ];
		if ( is_array( $assets ) ) {
			foreach ( $assets as $post_id => $elements ) {
				if ( is_array( $elements ) ) {
					foreach ( $elements as $element => $elementAssets ) {
						$files = array_merge( $files, $elementAssets );
					}
				}
			}
		}
		$files = array_unique( $files );

		if ( ! empty( $files ) ) {

			$bundleUrl = last( $this->event->fire( 'vc:assets:generate_scripts_bundle:get_bundle_url', [
				$files,
			] ) );

			$bundle = last( $this->event->fire( 'vc:assets:generate_scripts_bundle:get_bundle', [
				$files,
			] ) );
			if ( ! is_file( $bundle ) ) {
				$contents = '';
				foreach ( $files as $file ) {
					$filepath = VC_V_PLUGIN_DIR_PATH . 'public/sources/elements/' . $file;
					$contents .= last( $this->event->fire( 'driver:file:get_contents', [ $filepath ] ) ) . "\n";
				}

				$this->deleteAssetsBundles( 'js' );
				if ( ! last( $this->event->fire( 'driver:file:set_contents', [
					$bundle,
					$contents,
				] ) )
				) {
					return false;
				}
			}
		} else {
			$this->deleteAssetsBundles( 'js' );
			$bundleUrl = '';
		}

		$this->event->fire( 'driver:option:set', [
			'vc_v_scripts_bundle',
			$bundleUrl,
		] );

		return $bundleUrl;
	}

	/**
	 * Generate (save to fs and update db) scripts bundle
	 *
	 * Old files are deleted
	 *
	 * @param string $contents CSS contents to save
	 *
	 * @return bool|string URL to generated bundle
	 */
	private function generateStylesBundle( $contents ) {
		if ( $contents ) {
			$bundleUrl = last( $this->event->fire( 'vc:assets:generate_styles_bundle:get_bundle_url', [
				$contents,
			] ) );

			$bundle = last( $this->event->fire( 'vc:assets:generate_styles_bundle:get_bundle', [
				$contents,
			] ) );

			if ( ! is_file( $bundle ) ) {
				$this->deleteAssetsBundles( 'css' );
				if ( ! last( $this->event->fire( 'driver:file:set_contents', [
					$bundle,
					$contents,
				] ) )
				) {
					return false;
				}
			}
		} else {
			$this->deleteAssetsBundles( 'css' );
			$bundleUrl = '';
		}

		$this->event->fire( 'driver:option:set', [
			'vc_v_styles_bundle',
			$bundleUrl,
		] );

		return $bundleUrl;
	}

	/**
	 * @return array
	 */
	private function getStyleBundles() {
		$assets = last( $this->event->fire( 'driver:option:get', [
			'vc_v_styles',
			[ ],
		] ) );

		$list = [ ];
		if ( is_array( $assets ) ) {
			foreach ( $assets as $postId => $elements ) {
				$list = array_merge( $list, (array) $elements );
			}
		}

		$bundles = [ ];
		foreach ( $list as $element => $files ) {
			$contents = '';
			if ( is_array( $files ) ) {
				foreach ( $files as $file ) {
					$filepath = VC_V_PLUGIN_DIR_PATH . 'public/sources/elements/' . $file;
					$contents .= last( $this->event->fire( 'driver:file:get_content', [ $filepath ] ) ) . "\n";
				}
			}

			$bundles[] = [
				'filename' => $element . '.less',
				'contents' => $contents,
			];
		}

		return $bundles;
	}

	/**
	 * @param int $postId
	 * @param string $assetType scripts|styles
	 * @param string[] $postAssets
	 */
	private function updatePostAssets( $postId, $assetType, $postAssets ) {
		$optionName = 'vc_v_' . $assetType;

		$assets = last( $this->event->fire( 'driver:option:get', [
			$optionName,
			[ ],
		] ) );
		if ( ! is_array( $assets ) ) {
			$assets = [ ];
		}

		if ( $postAssets ) {
			$assets[ $postId ] = $postAssets;
		} else {
			unset( $assets[ $postId ] ); // @todo check for isset??
		}

		$this->event->fire( 'driver:option:set', [
			$optionName,
			$assets,
		] );
	}

	/**
	 * Remove all files by extension in asset-bundles directory
	 *
	 * @param string $extension
	 */
	private function deleteAssetsBundles( $extension = '' ) {
		$destinationDir = last( $this->event->fire( 'vc:assets:delete_assets_bundles:get_destionation_dir' ) );

		if ( $extension ) {
			$extension = '.' . $extension;
		}

		$files = glob( $destinationDir . '/*' . $extension );
		if ( is_array( $files ) ) {
			foreach ( $files as $file ) {
				unlink( $file );
			}
		}
	}

}
