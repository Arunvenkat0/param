import client from '../client';

export const CONTAINER = '.ui-dialog';
export const SWATCHES_SIZE = '.swatches.size';
export const SIZE_SELECTED_VALUE = [SWATCHES_SIZE, 'li.selected-value'].join(' ');
export const VARIATION_CONTAINER = '.product-variations';

function getCssSizeByIdx (idx) {
	return [
		CONTAINER,
		VARIATION_CONTAINER,
		SWATCHES_SIZE,
		'li:nth-child(' + idx + ')'
	].join(' ');
}

export function getCssSizeLinkByIdx (idx) {
	return getCssSizeByIdx(idx) + ' a';
}

export function getSizeTextByIdx(sizeIndex) {
	return client.getText(getCssSizeByIdx(sizeIndex))
		.then(text => text.trim());
}

