const NETMASK_128_0_0_0       = 0x80000000;

const parseIP = ip_str => {
    const [blk1, blk2, blk3, blk4] = ip_str.split(".").map(x => (parseInt(x, 10)));
    return (blk1 << 24) | (blk2 << 16) | (blk3 << 8) | blk4;
}

const inSubnet = (ip, cidr) => {
    const [raw_addr, raw_mask_bits] = cidr.split("/");
    
    const mask_bits = parseInt(raw_mask_bits);
    const netmask = NETMASK_128_0_0_0 >> (mask_bits - 1);

    const netmask_addr_blocks = raw_addr.split(".").map(x => parseInt(x, 10));
    let netmask_addr = netmask_addr_blocks[0] << 24
    netmask_addr = netmask_addr | (netmask_addr_blocks[1] << 16);
    netmask_addr = netmask_addr | (netmask_addr_blocks[2] << 8);
    netmask_addr = netmask_addr | netmask_addr_blocks[3];

    const min_addr = netmask_addr & netmask;
    const max_addr = netmask_addr | ~netmask;

    const addr = parseIP(ip);

    return addr <= max_addr && addr >= min_addr;
};

const isLocal = ip => {
    const classA = inSubnet(ip, "10.0.0.0/8");
    const classB = inSubnet(ip, "172.16.0.0/12");
    const classC = inSubnet(ip, "192.168.0.0/16");
    const localIPv4 = classA || classB || classC;

    const localIPv4v6 = ip.startsWith("::ffff:");
    const localIPv6 = ip.startsWith("fc00:") || ip.startsWith("fd00:");
    const local = localIPv4 || localIPv4v6 || localIPv6;
    
    const autoconfigIPv4 = inSubnet(ip, "169.254.0.0/16");
    const autoconfigIPv6 = ip.startsWith("fe80:");
    const autoconfig = autoconfigIPv4 || autoconfigIPv6;

    const loopbackIPv4 = inSubnet(ip, "127.0.0.0/8");
    const loopbackIPv6 = ip.startsWith("::1");
    const loopback = loopbackIPv4 || loopbackIPv6;

    return local || autoconfig || loopback;
};

const isNU = ip => {
    return inSubnet(ip, "129.105.0.0/16") || inSubnet(ip, "165.124.0.0/16");
};

const isLibrary = ip => {
    return inSubnet(ip, process.env.LIBRARY_SUBNET);
};

const isSherman = ip => {
    return inSubnet(ip, process.env.SHERMAN_SUBNET);
}

const isTSS = ip => {
    return isSherman(ip) || isLibrary(ip);
}

module.exports.isLocal = isLocal;
module.exports.isNU = isNU;
module.exports.isTSS = isTSS;