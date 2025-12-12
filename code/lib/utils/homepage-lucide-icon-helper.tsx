import { 
  Loader2Icon, AlertTriangleIcon, CheckIcon, LightbulbIcon,
  Palette, Code, Clock, User, Layers, DollarSign,
  LayoutGrid, RefreshCcw, MessageSquare, Zap, BarChart2,
  Wallet, Shield, Smartphone, CheckCircle2,
  CreditCard, Euro, Banknote, Smartphone as Mobile, Building, CircleDollarSign,
  ArrowRight
} from 'lucide-react';

// 定义工作状态的样式配置
export const workStageConfig = {
  0: {
    bgColor: 'bg-white dark:bg-gray-900',
    textColor: 'text-gray-800 dark:text-gray-200',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: null,
    label: '未开始'
  },
  1: {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Loader2Icon,
    label: '进行中'
  },
  2: {
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-800 dark:text-red-200',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertTriangleIcon,
    label: '有问题'
  },
  3: {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-200',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: LightbulbIcon,
    label: '需要注意'
  },
  4: {
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-800 dark:text-green-200',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckIcon,
    label: '已完成'
  }
} as const;

// 渲染面板图标的辅助函数
export const renderPanelIcon = (panelIcon?: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    Button: <ArrowRight className="w-5 h-5" />,
    Palette: <Palette className="w-5 h-5" />,
    Code: <Code className="w-5 h-5" />,
    Clock: <Clock className="w-5 h-5" />,
    User: <User className="w-5 h-5" />,
    Layers: <Layers className="w-5 h-5" />,
    DollarSign: <DollarSign className="w-5 h-5" />,
    LayoutGrid: <LayoutGrid className="w-5 h-5" />,
    RefreshCcw: <RefreshCcw className="w-5 h-5" />,
    MessageSquare: <MessageSquare className="w-5 h-5" />,
    Zap: <Zap className="w-5 h-5" />,
    BarChart2: <BarChart2 className="w-5 h-5" />,
    Wallet: <Wallet className="w-5 h-5" />,
    Shield: <Shield className="w-5 h-5" />,
    Smartphone: <Smartphone className="w-5 h-5" />,
    CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
    CreditCard: <CreditCard className="w-5 h-5" />,
    EuroSign: <Euro className="w-5 h-5" />,
    Euro: <Euro className="w-5 h-5" />,
    Banknote: <Banknote className="w-5 h-5" />,
    Mobile: <Mobile className="w-5 h-5" />,
    Building: <Building className="w-5 h-5" />,
    CircleDollarSign: <CircleDollarSign className="w-5 h-5" />
  };

  return panelIcon && iconMap[panelIcon] ? iconMap[panelIcon] : "▶️";
};