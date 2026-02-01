'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Settings, ExternalLink, Unlink } from 'lucide-react'

type IntegrationType = 'slack' | 'discord'

interface Integration {
  id: string
  type: IntegrationType
  webhook_url: string | null
  channel_name: string | null
  notify_on_new_feedback: boolean
  notify_on_status_change: boolean
  notify_on_new_comment: boolean
}

interface LinearIntegration {
  id: string
  org_id: string
  team_id: string | null
  team_name: string | null
  access_token: string
}

interface IntegrationsManagerProps {
  orgId: string
  initialIntegrations: Integration[]
  linearIntegration?: LinearIntegration | null
  linearAuthUrl?: string | null
}

// Slack Logo SVG
const SlackLogo = () => (
  <svg viewBox="0 0 54 54" className="w-8 h-8">
    <g fill="none" fillRule="evenodd">
      <path
        fill="#36C5F0"
        d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
      />
      <path
        fill="#2EB67D"
        d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
      />
      <path
        fill="#ECB22E"
        d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
      />
      <path
        fill="#E01E5A"
        d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"
      />
    </g>
  </svg>
)

// Discord Logo SVG
const DiscordLogo = () => (
  <svg viewBox="0 0 71 55" className="w-8 h-8">
    <path
      fill="#5865F2"
      d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9056 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6305 45.5858C52.8618 46.6197 51.0231 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0366 50.6034 51.254 52.57 52.5765 54.435C52.6325 54.5139 52.7333 54.5477 52.8257 54.5195C58.6319 52.7249 64.5145 50.0174 70.5874 45.5576C70.6406 45.5182 70.6742 45.459 70.6798 45.3942C72.1559 30.0791 68.2029 16.7757 60.2353 4.9823C60.2157 4.9429 60.1821 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
    />
  </svg>
)

// Linear Logo SVG
const LinearLogo = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8">
    <path
      fill="#5E6AD2"
      d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5765-11.0629-2.8283-20.7172-9.6571-27.0716-18.9581L1.22541 61.5228zM.00189135 46.8891c-.01764375.2833.00624.5666.07221.8471L23.0248 66.5556c.2106.1439.4601.2188.7154.2146l22.8082-.3745c.7768-.0127 1.1486-.9507.5966-1.5026L3.48006 21.2272c-.55203-.5519-1.48997-.1801-1.5027.5965l-.37485 22.8073c-.00415.2553.07078.5048.21458.7152l2.18573 3.202c.07504.0895.12607.195.14959.3086.02353.1137.01938.2314-.01214.3447-.03153.1133-.09008.2173-.17159.3046-.08152.0874-.18305.1554-.29753.1993-.11448.0439-.23758.0624-.36086.054-.12328-.0083-.24211-.0434-.34818-.1026-.10607-.0591-.19734-.1407-.26742-.2392l-.4724-.6633c-.21313-.2862-.53766-.4654-.89175-.4919L.00189135 46.8891zm1.70148935 5.1738l13.8172-2.2697c1.0135-.1664 1.6594-1.1887 1.3655-2.1592l-2.1968-7.2521c-.2939-.9705-1.4011-1.4116-2.2383-.8925L.512073 53.7203c-.14377.0889-.26268.2109-.34701.3561-.0843.1452-.13116.3088-.13662.4771l-.00021 5.1894c.00014.1376.03066.2735.08938.3983.05872.1248.14408.236.25018.326.10611.09.22998.1563.36264.1942.13267.0378.27165.0463.40734.0245l.01022-.0024c.2399-.0614.45698-.1916.6271-.3759.17012-.1842.28644-.4145.33611-.6651.00186-.0094.00343-.0189.00471-.0284l.69422-4.3261c.03823-.2382.1461-.4595.3108-.6378.16469-.1784.37716-.3066.61208-.3695.2349-.0629.4829-.0572.71462.0166.23171.0737.43589.2121.58864.3988.14054.1718.22787.3777.2539.599l1.2421 10.5689c.0379.3221.16946.6267.38097.8829.21151.2562.49071.4527.80914.5691.3184.1165.6611.1483.9929.0921.3318-.0563.6412-.1984.8964-.4118l.2124-.1778c.2023-.1693.4479-.2803.7102-.3207.2624-.0405.5309-.0091.7763.0909.2454.1.4585.2616.6163.4674.1577.2058.2543.4481.2794.7009.01.0997.0099.2001-.0003.2999l-.6166 6.0594c-.0234.2294.0093.4609.0955.6769.0862.216.225.4098.4064.5673.1815.1574.3999.2738.6388.3407.2389.0668.4903.0821.7353.0447.2451-.0374.4787-.1265.6832-.2606.2046-.1341.3746-.3095.4973-.5132.1226-.2038.1948-.4308.2112-.6635.0164-.2328-.0234-.466-.1165-.6826l-.56-1.304c-.1086-.2531-.1506-.5291-.1218-.8021.0289-.273.1274-.5342.2856-.7578.1582-.2236.3707-.402.6165-.5179.2458-.116.5165-.1648.7855-.1415l5.3197.4593c.2314.02.4651-.0153.6821-.103.217-.0877.4102-.2244.5641-.399l.8312-.9421c.4055-.4596 1.0839-.5464 1.5936-.2039l7.9893 5.3706c.3097.2082.6779.3088 1.0497.2872.3717-.0217.7249-.164.9973-.401l.3696-.3216c.3606-.3138.8359-.4635 1.3125-.4134l.9667.1016c.4559.0479.8789-.2206 1.0215-.6476l3.3069-9.8986c.1495-.4477.5597-.7668 1.0294-.8013l.4912-.036c.4697-.0345.9183.1966 1.1253.5806l.3587.6652c.2387.4425.7279.6813 1.2213.596l.5988-.1036c.4813-.0833.8902-.4193 1.0688-.8779l2.0925-5.3707c.2241-.5749.8007-.9372 1.419-.8918l.6277.046c.6184.0454 1.1463-.4021 1.2608-1.0068l.1138-.601c.1145-.6047.6424-1.0522 1.2607-1.0068l.4088.03c.6183.0454 1.1949-.4021 1.3094-1.0068l.0571-.3016c.1145-.6047.691-.9856 1.2996-.8589l4.028.8393c.6086.1267 1.1851-.254 1.2996-.8588l.0381-.201c.0906-.4785-.1126-.9677-.5265-1.2677l-3.1989-2.3184c-.4139-.3-1.0171-.4052-1.4616-.2556l-.4979.1675c-.4445.1495-.9477.1444-1.3867-.0141l-.4919-.1776c-.439-.1586-.9141-.1637-1.3571-.0144l-2.6606.8968c-.443.1493-.9181.1443-1.3572-.0144l-.5919-.2139c-.4391-.1587-.845-.4384-1.1551-.7942l-.5413-.621c-.3101-.3558-.6872-.6355-1.0727-.7954-.3856-.1599-.7733-.2017-1.1019-.1188l-.3098.0781c-.3287.0829-.6136.2802-.8092.561-.1956.2807-.2929.624-.2766.9767l.0171.3671c.0163.3527.1332.6987.3324.984l1.1978 1.7151c.1992.2852.3086.6275.3113.9733.0026.3458-.0992.6852-.2898.9655l-.0856.1258c-.1906.2803-.2798.6158-.2538.9545.026.3387.1656.6637.3976.9256l.2568.2898c.232.2618.4607.5904.6508.9355.1901.3452.3406.7042.4283 1.0206l.1072.387c.0877.3164.0987.6558.0316.9659-.0671.3102-.2116.5823-.4111.7745l-.1508.1452c-.1995.1922-.3286.4558-.3672.7508-.0385.2949.0099.595.1377.8545l.1329.2699c.1278.2596.1619.556.0969.8435-.065.2875-.2267.5477-.4601.7406l-.1896.1566c-.2334.1928-.3822.4473-.4232.724-.041.2766.0151.5571.1596.7982l.2279.3803c.1445.241.1969.5208.1492.7959-.0478.275-.1932.5279-.4135.7196l-.4016.3493c-.2203.1916-.3512.4438-.3725.7172-.0212.2734.0552.5451.2173.7731l.2698.3796c.1621.228.2248.5011.1783.7764-.0465.2754-.1857.5308-.3957.7265l-.2696.2514c-.2099.1957-.3357.448-.3575.7171-.0218.2691.0596.5369.2311.7612l.2274.2973c.1715.2244.2406.4984.1961.7785-.0445.28-.2012.536-.4448.7268l-.3478.2722c-.2437.1909-.4008.4557-.4464.7524-.0455.2967.0267.5981.205.8562l.2104.3046c.1782.2581.255.563.2181.8657-.0368.3027-.1868.5863-.4255.8044l-.314.287c-.2386.2181-.3884.5065-.4254.8183-.0371.3117.044.6265.2302.8937l.8076 1.1584c.2058.2954.2988.6474.2623.993-.0365.3456-.1997.6663-.4604.9044l-.7254.6625c-.2607.2381-.4235.5633-.4595.9175-.0359.3542.0581.7091.265 1.001l.2655.375c.2068.2919.2954.6449.2512.9972-.0441.3523-.2178.6785-.4915.9221l-.397.3536c-.2737.2436-.4547.5725-.5115.9295-.0568.357.0072.7226.1808 1.0329l.3003.5368c.1736.3102.2316.6757.1638 1.0325-.0678.3568-.2514.6852-.5189.9278l-.3614.3276c-.2675.2425-.452.5651-.5218.9121-.0698.3469-.0164.7058.1511 1.0152l.7233 1.3373c.1675.3095.2137.6677.1307 1.0134-.0831.3457-.2848.6572-.5702.8811l-.6628.52c-.2854.2239-.4864.539-.5686.8908-.0822.3518-.0349.7197.1337 1.04l.6159 1.1695c.1686.3202.214.6857.1286 1.0346-.0855.349-.2912.6599-.5826.8807-.1457.1104-.3128.1907-.4906.2358-.1778.0451-.3626.0541-.5424.0268-.1798-.0274-.3515-.0906-.5036-.1854-.1521-.0949-.2815-.2193-.3796-.365l-1.2106-1.7976c-.0981-.1458-.1672-.3103-.2028-.4826-.0356-.1724-.0369-.3504-.0038-.5221l.7176-3.7202c.0466-.2419.0306-.4921-.046-.7269-.0767-.2348-.2124-.4488-.394-.6214l-1.9095-1.8154c-.1816-.1726-.4039-.2971-.6459-.3616-.242-.0644-.4967-.0666-.74-.0063l-.4179.1036c-.2432.0603-.4976.0549-.7393-.0158-.2416-.0707-.4608-.2005-.6368-.3771-.1759-.1765-.303-.3942-.3693-.6324-.0663-.2381-.0701-.4891-.0112-.7288l.9251-3.7638c.1046-.4254-.0073-.8766-.2975-1.1994l-.8679-.9658c-.2902-.323-.4443-.7499-.4334-1.2012l.1014-4.2025c.0109-.4513-.1434-.893-.4337-1.2433l-.6295-.7597c-.2903-.3503-.4448-.7922-.4339-1.2435l.1053-4.3634c.0109-.4512-.1434-.8929-.4337-1.2432l-.6217-.7502c-.2903-.3503-.4448-.7922-.4339-1.2435l.1195-4.951c.0067-.2742-.0591-.5458-.1923-.7938-.1333-.248-.3302-.4657-.5757-.6363l-.6284-.4362c-.2455-.1706-.4424-.4-.5757-.6709-.1332-.2308-.2058-.4884-.2124-.7523v-.0316c-.0133-.5529.265-1.0726.733-1.3689l.8014-.5073c.468-.2963.7463-.8161.733-1.3689l-.0255-1.0605c-.0133-.5528-.2989-1.0592-.752-1.3336l-3.4088-2.0636c-.4531-.2743-.8823-.7066-1.1291-1.1373l-1.4096-2.4581c-.2468-.4307-.6332-.7727-1.0174-.9002l-3.0609-1.0166c-.384-.1275-.7262-.4114-.9005-.7471l-1.1203-2.1573c-.1742-.3357-.5164-.6196-.9005-.747l-4.5879-1.5218c-.3841-.1274-.8133-.1144-1.1292.0341l-3.4049 1.6013c-.316.1485-.6764.2084-1.0363.1719l-4.5117-.4573c-.3599-.0365-.7204.0232-1.0364.1718l-.3575.168c-.316.1485-.5753.4011-.7452.7264-.17.3253-.2444.6986-.2138 1.0737l.0432.5289c.0306.375-.0438.7512-.2137 1.0807l-.1618.3137c-.17.3294-.4293.5863-.7453.7392-.3161.1528-.6765.217-1.0364.1844l-4.53929-.4596c-.35996-.0365-.72037.0233-1.03633.1718l-.06287.0296c-.31596.1486-.5752.4011-.74514.7264-.16995.3253-.24438.6986-.21381 1.0737l.19124 2.3476c.03057.3751.15748.7342.36503 1.0321.20754.298.48787.5242.8059.6509l3.1937 1.2734c.31803.1267.59836.3569.8059.6615.20755.3046.3346.6702.36517 1.0514l.19104 2.3841c.03057.3811.18782.7452.45169 1.046.26386.3008.61046.5213.9959.6334l1.44.4186c.38544.1121.73204.3326.99591.6334.26386.3008.42112.6649.4517 1.046l.01806.2253c.03058.3811.18782.7452.45168 1.046.26387.3008.61046.5214.9959.6335l.08298.0248c.38544.1121.73205.3326.99591.6334.26386.3008.42112.6649.4517 1.046l.01785.2227c.03057.3811.18782.7452.45168 1.046.26387.3008.61047.5214.99592.6335l2.98139.8922c.38544.1121.73204.3326.9959.6334.26387.3008.42113.6649.45169 1.046l.04988.6222c.03056.3811.18781.7452.45168 1.046.26387.3008.61047.5214.99591.6335l.14068.0421c.38544.1121.73204.3326.99591.6334.26386.3008.42112.6649.4517 1.046l.18549 2.3147c.03057.3811.18782.7452.45168 1.046.26387.3008.61046.5214.99591.6335l.38374.1149c.38544.1121.73204.3326.99591.6334.26386.3008.42112.6649.45169 1.046l.02058.2568c.03055.381.18766.745.45133 1.0457.26366.3008.61008.5214.99546.6339l.11698.035c.38539.1125.73192.3331.99558 1.0339.26366.3008.42091.6648.45147 1.0459l.04988.6221c.03056.3811.18781.7452.45168 1.046.26387.3008.61047.5214.99591.6335l.21652.0648c.38545.1121.73205.3326.99591.6334.26387.3008.42113.6649.4517 1.0461l.08693 1.0848c.03056.3811.18781.7452.45168 1.0459.26386.3008.61046.5214.99591.6335l.00618.0019c.38544.1121.73204.3326.99591.6334.26386.3007.42112.6648.4517 1.0459l.0389.4856c.03056.3811.18781.7452.45168 1.046.26386.3007.61046.5213.9959.6335l.03889.0116c.38545.1121.73205.3326.99591.6334.26387.3008.42113.6649.4517 1.0461l.20188 2.5198c.03056.3811.18781.7452.45168 1.046.26386.3007.61046.5213.9959.6334l.03889.0116c.38544.1122.73205.3327.99591.6335.26386.3007.42112.6648.4517 1.046l.26003 3.2445c.02933.366-.02131.7349-.14853 1.0828-.12722.3479-.32885.6685-.59185.9414-.26299.273-.58206.4918-.93687.6426-.35481.1508-.73643.2302-1.12053.2333l-.08693.0007c-.38408.003-.76569.0872-1.12028.2474-.35458.1601-.66982.3926-.92573.6832-.25592.2906-.44759.6284-.56295.9922-.11536.3638-.15174.7474-.10668 1.1253l.05893.4945c.04506.3779-.01132.7618-.16548 1.1268-.15417.365-.39256.6904-.70019.9552-.30762.2649-.67288.4613-1.07275.5765-.39987.1153-.82006.1465-1.23406.0917l-.32706-.0433c-.41396-.0548-.8341-.0191-1.23353.1048-.39943.1239-.76381.3283-1.07027.6002-.30647.2718-.54346.6034-.69609.9733-.15263.3699-.21755.7673-.19052 1.1643l.0268.3932c.02702.3971-.05693.7943-.24634 1.1656-.18941.3714-.47027.7036-.82413.9748-.35387.2712-.77024.474-1.22195.5952-.45171.1212-.92812.158-1.39817.1078l-.39866-.0425c-.47004-.0501-.9462-.013-1.39753.1088-.45133.1219-.86716.3249-1.2207.5964-.35353.2716-.63405.6041-.82345.9758-.18941.3717-.28369.7693-.27684 1.1673l.00464.2693c.00686.3979-.09553.7924-.3006 1.1581-.20508.3657-.50249.6893-.87284.9493-.37035.2599-.80748.4485-1.2827.5535-.47522.105-.97217.123-1.45839.0529l-3.30175-.4762c-.48621-.0701-.98315-.0517-1.45808.054-.47493.1058-.91147.2949-1.28115.555-.36968.2601-.66658.5837-.87142.9496-.20484.3658-.30724.7604-.30038 1.1582l.01388.8031c.00568.3287-.06171.6554-.19781.9601-.13611.3046-.33757.5791-.59121.8062-.25364.227-.5616.401-.90428.5115-.34267.1104-.71029.1549-1.07997.1309l-3.0648-.1989c-.36968-.024-.73731.0205-1.07997.1309-.34269.1104-.65064.2844-.90428.5115-.25364.227-.45509.5016-.59121.8063-.13611.3046-.20349.6313-.19781.96l.0144.8344c.00454.2632-.03855.5254-.12677.7711-.0882.2457-.22034.4701-.38866.6598-.16832.1898-.37007.3412-.59309.4453-.22301.104-.46276.1586-.70479.1605l-.05296.0004c-.24203.0019-.48178-.0461-.70479-.1411-.22302-.095-.42477-.2379-.59309-.4202-.16832-.1823-.30047-.3999-.38867-.6397-.0882-.2397-.1312-.4966-.12677-.7529l.07318-4.3054c.00825-.4853-.17377-.9553-.50846-1.3125l-.5652-.6033c-.33469-.3572-.51672-.8272-.50846-1.3125l.07318-4.3054c.00825-.4853-.17378-.9553-.50846-1.3125l-.04813-.0514c-.33468-.3572-.51671-.8272-.50846-1.3125l.06306-3.7103c.00826-.4852-.17377-.9552-.50846-1.3125l-.04812-.0514c-.33469-.3572-.51672-.8272-.50846-1.3125l.06306-3.7103c.00825-.4852-.17377-.9552-.50846-1.3125l-.04813-.0514c-.33468-.3572-.51671-.8272-.50846-1.3124l.04996-2.9393c.00826-.4852-.17377-.9553-.50846-1.3125l-1.11658-1.1921c-.33469-.3572-.67419-.7817-.9484-1.1849l-3.08152-4.5275c-.27421-.4031-.4869-.8556-.59381-1.2625l-.8403-3.2009c-.10691-.4069-.1361-.8461-.08139-1.226l.56654-3.9412c.05471-.3798.01761-.7764-.10364-1.1073-.12124-.3309-.32872-.6138-.5791-.7896l-.20092-.141c-.25039-.1758-.45787-.4587-.5791-.7896-.12126-.3309-.15836-.7275-.10365-1.1073l.5666-3.9413c.05471-.3798.01761-.7764-.10365-1.1074-.12124-.3309-.32871-.6138-.5791-.7896l-.20091-.141c-.25038-.1757-.45786-.4586-.5791-.7896-.12125-.3309-.15835-.7275-.10364-1.1073l.56654-3.9413c.05471-.3798.01761-.7764-.10365-1.1073-.12124-.331-.32871-.6139-.57909-.7896l-.20087-.141c-.25038-.1758-.45786-.4587-.5791-.7897-.12125-.3309-.15835-.7275-.10365-1.1073l.56655-3.9412c.05471-.3799.01761-.7765-.10364-1.1074-.12124-.3309-.32872-.6138-.5791-.7896l-.68685-.4824c-.25038-.1758-.45785-.4595-.5791-.7917-.12126-.3322-.15835-.7302-.10365-1.1115L1.70338 52.063z"
    />
  </svg>
)

export function IntegrationsManager({
  orgId,
  initialIntegrations,
  linearIntegration,
  linearAuthUrl,
}: IntegrationsManagerProps) {
  const router = useRouter()
  const findIntegration = (type: IntegrationType) =>
    initialIntegrations.find((i) => i.type === type)

  const [slack, setSlack] = useState(() => ({
    webhook_url: findIntegration('slack')?.webhook_url || '',
    channel_name: findIntegration('slack')?.channel_name || '',
    notify_on_new_feedback: findIntegration('slack')?.notify_on_new_feedback ?? true,
    notify_on_status_change: findIntegration('slack')?.notify_on_status_change ?? true,
    notify_on_new_comment: findIntegration('slack')?.notify_on_new_comment ?? false,
  }))

  const [discord, setDiscord] = useState(() => ({
    webhook_url: findIntegration('discord')?.webhook_url || '',
    channel_name: findIntegration('discord')?.channel_name || '',
    notify_on_new_feedback: findIntegration('discord')?.notify_on_new_feedback ?? true,
    notify_on_status_change: findIntegration('discord')?.notify_on_status_change ?? true,
    notify_on_new_comment: findIntegration('discord')?.notify_on_new_comment ?? false,
  }))

  const [saving, setSaving] = useState(false)
  const [configuring, setConfiguring] = useState<IntegrationType | null>(null)

  const saveIntegration = async (type: IntegrationType) => {
    setSaving(true)
    const payload = type === 'slack' ? slack : discord
    const response = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, type, ...payload }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to save integration.')
      setSaving(false)
      return
    }
    toast.success(`${type === 'slack' ? 'Slack' : 'Discord'} integration saved!`)
    setSaving(false)
    setConfiguring(null)
  }

  const isConnected = (type: IntegrationType) => {
    const state = type === 'slack' ? slack : discord
    return !!state.webhook_url
  }

  return (
    <div className="space-y-4">
      {/* Slack Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
              <SlackLogo />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                Slack
                {isConnected('slack') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Get notified about new feedback and updates in Slack
              </p>
            </div>
          </div>
          <Dialog open={configuring === 'slack'} onOpenChange={(open) => setConfiguring(open ? 'slack' : null)}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <SlackLogo />
                  Configure Slack
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slack.webhook_url}
                    onChange={(e) => setSlack((prev) => ({ ...prev, webhook_url: e.target.value }))}
                  />
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    Learn how to create a webhook <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-channel">Channel Name (optional)</Label>
                  <Input
                    id="slack-channel"
                    placeholder="#feedback"
                    value={slack.channel_name}
                    onChange={(e) => setSlack((prev) => ({ ...prev, channel_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Notification Events</Label>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Feedback</p>
                      <p className="text-xs text-gray-500">When someone submits new feedback</p>
                    </div>
                    <Switch
                      checked={slack.notify_on_new_feedback}
                      onCheckedChange={(checked) =>
                        setSlack((prev) => ({ ...prev, notify_on_new_feedback: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Changes</p>
                      <p className="text-xs text-gray-500">When feedback status is updated</p>
                    </div>
                    <Switch
                      checked={slack.notify_on_status_change}
                      onCheckedChange={(checked) =>
                        setSlack((prev) => ({ ...prev, notify_on_status_change: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Comments</p>
                      <p className="text-xs text-gray-500">When someone comments on feedback</p>
                    </div>
                    <Switch
                      checked={slack.notify_on_new_comment}
                      onCheckedChange={(checked) =>
                        setSlack((prev) => ({ ...prev, notify_on_new_comment: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfiguring(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveIntegration('slack')}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Discord Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#5865F2] flex items-center justify-center">
              <svg viewBox="0 0 71 55" className="w-7 h-7">
                <path
                  fill="white"
                  d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9056 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6305 45.5858C52.8618 46.6197 51.0231 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0366 50.6034 51.254 52.57 52.5765 54.435C52.6325 54.5139 52.7333 54.5477 52.8257 54.5195C58.6319 52.7249 64.5145 50.0174 70.5874 45.5576C70.6406 45.5182 70.6742 45.459 70.6798 45.3942C72.1559 30.0791 68.2029 16.7757 60.2353 4.9823C60.2157 4.9429 60.1821 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                Discord
                {isConnected('discord') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Get notified about new feedback and updates in Discord
              </p>
            </div>
          </div>
          <Dialog open={configuring === 'discord'} onOpenChange={(open) => setConfiguring(open ? 'discord' : null)}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center">
                    <svg viewBox="0 0 71 55" className="w-5 h-5">
                      <path
                        fill="white"
                        d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9056 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6305 45.5858C52.8618 46.6197 51.0231 47.4931 49.0893 48.2228C48.9634 48.2707 48.9074 48.4172 48.969 48.5383C50.0366 50.6034 51.254 52.57 52.5765 54.435C52.6325 54.5139 52.7333 54.5477 52.8257 54.5195C58.6319 52.7249 64.5145 50.0174 70.5874 45.5576C70.6406 45.5182 70.6742 45.459 70.6798 45.3942C72.1559 30.0791 68.2029 16.7757 60.2353 4.9823C60.2157 4.9429 60.1821 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                      />
                    </svg>
                  </div>
                  Configure Discord
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="discord-webhook">Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discord.webhook_url}
                    onChange={(e) => setDiscord((prev) => ({ ...prev, webhook_url: e.target.value }))}
                  />
                  <a
                    href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    Learn how to create a webhook <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discord-channel">Channel Name (optional)</Label>
                  <Input
                    id="discord-channel"
                    placeholder="#feedback"
                    value={discord.channel_name}
                    onChange={(e) => setDiscord((prev) => ({ ...prev, channel_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Notification Events</Label>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Feedback</p>
                      <p className="text-xs text-gray-500">When someone submits new feedback</p>
                    </div>
                    <Switch
                      checked={discord.notify_on_new_feedback}
                      onCheckedChange={(checked) =>
                        setDiscord((prev) => ({ ...prev, notify_on_new_feedback: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Changes</p>
                      <p className="text-xs text-gray-500">When feedback status is updated</p>
                    </div>
                    <Switch
                      checked={discord.notify_on_status_change}
                      onCheckedChange={(checked) =>
                        setDiscord((prev) => ({ ...prev, notify_on_status_change: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Comments</p>
                      <p className="text-xs text-gray-500">When someone comments on feedback</p>
                    </div>
                    <Switch
                      checked={discord.notify_on_new_comment}
                      onCheckedChange={(checked) =>
                        setDiscord((prev) => ({ ...prev, notify_on_new_comment: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfiguring(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveIntegration('discord')}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Linear Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
              <LinearLogo />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                Linear
                {linearIntegration && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                {linearIntegration
                  ? `Connected to ${linearIntegration.team_name || 'Linear'}`
                  : 'Sync feedback with Linear issues for seamless tracking'}
              </p>
            </div>
          </div>
          {linearIntegration ? (
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => {
                const response = await fetch(`/api/linear/disconnect`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ org_id: orgId }),
                })
                if (response.ok) {
                  toast.success('Linear disconnected')
                  router.refresh()
                } else {
                  toast.error('Failed to disconnect Linear')
                }
              }}
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </Button>
          ) : linearAuthUrl ? (
            <Button
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => window.location.href = linearAuthUrl}
            >
              <ExternalLink className="h-4 w-4" />
              Connect
            </Button>
          ) : (
            <Button disabled className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
