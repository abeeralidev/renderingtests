import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import sv from './slide_3.svg'
import {Img} from 'remotion';

export const Slide: React.FC<{
	titleText: string;
	titleColor: string;
}> = ({titleText, titleColor}) => {
	const videoConfig = useVideoConfig();
	const frame = useCurrentFrame();
	const text = titleText.split(' ').map((t) => ` ${t} `);
	return (
		<Img src={sv} />
	);
};
