import { motion, useReducedMotion } from 'framer-motion'
import { Navigate, useParams } from 'react-router-dom'
import ToolPageHeader from '../components/ToolPageHeader'
import { pageEnter } from '../lib/motion'
import Base64Tool from '../tools/base64/Base64Tool'
import CalculatorTool from '../tools/calculator/CalculatorTool'
import CalendarTool from '../tools/calendar/CalendarTool'
import CaseTool from '../tools/case/CaseTool'
import ClipboardTool from '../tools/clipboard/ClipboardTool'
import ColorTool from '../tools/color/ColorTool'
import DiffTool from '../tools/diff/DiffTool'
import HashTool from '../tools/hash/HashTool'
import HtmlEntityTool from '../tools/htmlentity/HtmlEntityTool'
import ImageBatchTool from '../tools/imagebatch/ImageBatchTool'
import JsonTool from '../tools/json/JsonTool'
import JwtTool from '../tools/jwt/JwtTool'
import LanTool from '../tools/lan/LanTool'
import MarkdownTool from '../tools/markdown/MarkdownTool'
import NetworkTool from '../tools/network/NetworkTool'
import PasswordTool from '../tools/password/PasswordTool'
import QrcodeTool from '../tools/qrcode/QrcodeTool'
import RadixTool from '../tools/radix/RadixTool'
import RecorderTool from '../tools/recorder/RecorderTool'
import RegexTool from '../tools/regex/RegexTool'
import RenameTool from '../tools/rename/RenameTool'
import ScreenshotTool from '../tools/screenshot/ScreenshotTool'
import TimestampTool from '../tools/timestamp/TimestampTool'
import TodoTool from '../tools/todo/TodoTool'
import TranslateTool from '../tools/translate/TranslateTool'
import UrlTool from '../tools/url/UrlTool'
import UuidTool from '../tools/uuid/UuidTool'
import VideoBatchTool from '../tools/videobatch/VideoBatchTool'

type ToolEntry = {
  title: string
  description: string
  Component: () => React.JSX.Element
}

const TOOL_MAP: Record<string, ToolEntry> = {
  json: { title: 'JSON 格式化', description: '格式化与压缩 JSON 文本', Component: JsonTool },
  jwt: { title: 'JWT 解析', description: '解码 JWT Header / Payload', Component: JwtTool },
  base64: { title: 'Base64', description: 'Base64 编码与解码', Component: Base64Tool },
  url: { title: 'URL 编解码', description: 'URL 编码与解码', Component: UrlTool },
  timestamp: { title: '时间戳', description: '时间戳与日期互转', Component: TimestampTool },
  hash: { title: 'Hash', description: '计算常见哈希值', Component: HashTool },
  uuid: { title: 'UUID', description: '生成 UUID', Component: UuidTool },
  password: { title: '密码生成', description: '生成随机安全密码', Component: PasswordTool },
  radix: { title: '进制转换', description: '进制互转', Component: RadixTool },
  calculator: { title: '计算器', description: '表达式计算器', Component: CalculatorTool },
  calendar: {
    title: '日期时间日历',
    description: '月历查看、当前时间与日期详情',
    Component: CalendarTool
  },
  htmlentity: { title: 'HTML 实体', description: 'HTML 实体编解码', Component: HtmlEntityTool },
  qrcode: { title: '二维码', description: '生成二维码', Component: QrcodeTool },
  color: { title: '颜色转换', description: 'HEX / RGB / HSL', Component: ColorTool },
  diff: { title: '文本对比', description: '对比文本差异', Component: DiffTool },
  regex: { title: '正则测试', description: '正则匹配测试', Component: RegexTool },
  case: { title: '命名转换', description: '命名风格转换', Component: CaseTool },
  clipboard: { title: '剪切板', description: '剪切板历史', Component: ClipboardTool },
  todo: { title: '待办', description: '本地待办清单', Component: TodoTool },
  markdown: { title: 'Markdown 笔记', description: '笔记与预览', Component: MarkdownTool },
  translate: { title: '翻译', description: '在线文本翻译', Component: TranslateTool },
  rename: { title: '批量重命名', description: '按规则重命名', Component: RenameTool },
  screenshot: { title: '截图', description: '截图后标注编辑并保存', Component: ScreenshotTool },
  recorder: { title: '录屏', description: '录制屏幕', Component: RecorderTool },
  imagebatch: { title: '图片批量处理', description: '批量缩放转换', Component: ImageBatchTool },
  videobatch: { title: '视频批量处理', description: 'ffmpeg 批量转码', Component: VideoBatchTool },
  network: { title: '网络检测', description: 'IP / DNS / 延迟', Component: NetworkTool },
  lan: { title: '局域网传输', description: '局域网文件共享', Component: LanTool }
}

export default function ToolHostPage(): React.JSX.Element {
  const { toolId } = useParams<{ toolId: string }>()
  const entry = toolId ? TOOL_MAP[toolId] : undefined
  const reduceMotion = useReducedMotion()

  if (!entry) {
    return <Navigate to="/" replace />
  }

  const { title, description, Component } = entry

  return (
    <motion.div
      className="tool-page"
      key={toolId}
      variants={pageEnter}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="tool-page__chrome">
        <ToolPageHeader title={title} description={description} />
      </div>
      <motion.div
        className="tool-page__body"
        variants={pageEnter}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        transition={{ delay: reduceMotion ? 0 : 0.06 }}
      >
        <Component />
      </motion.div>
    </motion.div>
  )
}
