import {
	ArrowDownToolbarItem,
	ArrowLeftToolbarItem,
	ArrowRightToolbarItem,
	ArrowToolbarItem,
	ArrowUpToolbarItem,
	AssetToolbarItem,
	CheckBoxToolbarItem,
	CloudToolbarItem,
	DefaultToolbar,
	DiamondToolbarItem,
	DrawToolbarItem,
	EllipseToolbarItem,
	EraserToolbarItem,
	FrameToolbarItem,
	HandToolbarItem,
	HeartToolbarItem,
	HexagonToolbarItem,
	HighlightToolbarItem,
	LaserToolbarItem,
	LineToolbarItem,
	NoteToolbarItem,
	OvalToolbarItem,
	RectangleToolbarItem,
	RhombusToolbarItem,
	SelectToolbarItem,
	StarToolbarItem,
	TextToolbarItem,
	TldrawUiMenuItem,
	TriangleToolbarItem,
	useIsToolSelected,
	useTools,
	XBoxToolbarItem,
} from 'tldraw'

export function CustomToolbar() {
	const tools = useTools()
	const isAreaCaptureSelected = useIsToolSelected(tools['area-capture'])

	// maxItems=1 keeps Agent Draw as the only visible item; all others collapse
	// into the overflow/more menu that DefaultToolbar renders automatically.
	return (
		<DefaultToolbar maxItems={1}>
			<TldrawUiMenuItem {...tools['area-capture']} isSelected={isAreaCaptureSelected} />

			<SelectToolbarItem />
			<HandToolbarItem />
			<DrawToolbarItem />
			<EraserToolbarItem />
			<ArrowToolbarItem />
			<TextToolbarItem />
			<NoteToolbarItem />
			<AssetToolbarItem />
			<RectangleToolbarItem />
			<EllipseToolbarItem />
			<TriangleToolbarItem />
			<DiamondToolbarItem />
			<HexagonToolbarItem />
			<OvalToolbarItem />
			<RhombusToolbarItem />
			<StarToolbarItem />
			<CloudToolbarItem />
			<HeartToolbarItem />
			<XBoxToolbarItem />
			<CheckBoxToolbarItem />
			<ArrowLeftToolbarItem />
			<ArrowUpToolbarItem />
			<ArrowDownToolbarItem />
			<ArrowRightToolbarItem />
			<LineToolbarItem />
			<HighlightToolbarItem />
			<LaserToolbarItem />
			<FrameToolbarItem />
		</DefaultToolbar>
	)
}
