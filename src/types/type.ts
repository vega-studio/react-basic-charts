import { 
  createAtlas, 
  createFont, 
  WebGLStat, 
  TextureSize, 
  FontMapGlyphType
} from "deltav";

export type BarType = {
  label: string;
  value: number;
  color: [number, number, number, number];
}

export const DEFAULT_RESOURCES = {
  atlas: createAtlas({
    height: Math.min(WebGLStat.MAX_TEXTURE_SIZE, TextureSize._4096),
    key: "atlas",
    width: Math.min(WebGLStat.MAX_TEXTURE_SIZE, TextureSize._4096)
  }),
  font: createFont({
    dynamic: true,
    fontSource: {
      localKerningCache: false,
      size: 64,
      family: "Lucida Grande",
      type: FontMapGlyphType.BITMAP,
      weight: "normal"
    },
    fontMapSize: [TextureSize._2048, TextureSize._2048]
  })
};