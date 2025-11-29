import { cubicOut } from 'svelte/easing';
import type { EasingFunction, TransitionConfig } from 'svelte/transition';

export interface SlideParams {
	delay?: number;
	duration?: number;
	easing?: EasingFunction;
	axis?: 'x' | 'y';
}

export function safeSlide(
	node: Element,
	{ delay = 0, duration = 400, easing = cubicOut, axis = 'y' }: SlideParams = {}
): TransitionConfig {
	const style = getComputedStyle(node);
	const opacity = +style.opacity;
	const primary_property = axis === 'y' ? 'height' : 'width';
	const primary_property_value = parseFloat(style[primary_property]);
	const secondary_properties =
		axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
	const capitalized_secondary_properties = secondary_properties.map(
		(e) => `${e[0].toUpperCase()}${e.slice(1)}`
	);
	const padding_start_value = parseFloat(
		style[`padding${capitalized_secondary_properties[0]}` as any]
	);
	const padding_end_value = parseFloat(
		style[`padding${capitalized_secondary_properties[1]}` as any]
	);
	const margin_start_value = parseFloat(
		style[`margin${capitalized_secondary_properties[0]}` as any]
	);
	const margin_end_value = parseFloat(
		style[`margin${capitalized_secondary_properties[1]}` as any]
	);
	const border_width_start_value = parseFloat(
		style[`border${capitalized_secondary_properties[0]}Width` as any]
	);
	const border_width_end_value = parseFloat(
		style[`border${capitalized_secondary_properties[1]}Width` as any]
	);

	return {
		delay,
		duration,
		easing,
		css: (t) => {
			const e = easing(t);
			// Safety check: ensure values are not NaN
			const safe_primary = isNaN(primary_property_value)
				? 0
				: primary_property_value;
			const safe_padding_start = isNaN(padding_start_value)
				? 0
				: padding_start_value;
			const safe_padding_end = isNaN(padding_end_value)
				? 0
				: padding_end_value;
			const safe_margin_start = isNaN(margin_start_value)
				? 0
				: margin_start_value;
			const safe_margin_end = isNaN(margin_end_value) ? 0 : margin_end_value;
			const safe_border_start = isNaN(border_width_start_value)
				? 0
				: border_width_start_value;
			const safe_border_end = isNaN(border_width_end_value)
				? 0
				: border_width_end_value;

			return `
			overflow: hidden;
			opacity: ${Math.min(t * 20, 1) * opacity};
			${primary_property}: ${t * safe_primary}px;
			padding-${secondary_properties[0]}: ${t * safe_padding_start}px;
			padding-${secondary_properties[1]}: ${t * safe_padding_end}px;
			margin-${secondary_properties[0]}: ${t * safe_margin_start}px;
			margin-${secondary_properties[1]}: ${t * safe_margin_end}px;
			border-${secondary_properties[0]}-width: ${t * safe_border_start}px;
			border-${secondary_properties[1]}-width: ${t * safe_border_end}px;
		`;
		}
	};
}
