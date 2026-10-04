import zlib, struct
def png(path, n, pad):
    bg=(200,64,42); fg=(255,250,240)
    px=[[bg]*n for _ in range(n)]
    def rect(x0,y0,x1,y1):
        for y in range(int(y0*n),int(y1*n)):
            for x in range(int(x0*n),int(x1*n)):
                px[y][x]=fg
    s=1-2*pad; o=pad
    R=lambda a,b,c,d: rect(o+a*s,o+b*s,o+c*s,o+d*s)
    R(0.12,0.22,0.88,0.31)   # kasagi
    R(0.18,0.31,0.82,0.36)
    R(0.20,0.45,0.80,0.52)   # nuki
    R(0.27,0.31,0.35,0.86)   # pillars
    R(0.65,0.31,0.73,0.86)
    R(0.47,0.36,0.53,0.45)   # gakuzuka
    raw=b''.join(b'\x00'+bytes(c for p in row for c in p) for row in px)
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    open(path,'wb').write(data)
png('icons/icon-512.png',512,0.14)
png('icons/icon-192.png',192,0.14)
png('icons/apple-touch-icon.png',180,0.1)
